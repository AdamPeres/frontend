package experiments

import play.api.mvc.RequestHeader
import views.support.CamelCase

class CanCheckExperiment(e: ExperimentsDefinition)

sealed trait Participation
case object Participant extends Participation
case object Control extends Participation
case object Excluded extends Participation

trait ExperimentsDefinition {

  val allExperiments: Set[Experiment]
  implicit val canCheckExperiment: CanCheckExperiment

  def getJavascriptConfig(implicit request: RequestHeader): String = {
    allExperiments
      .filter(e => isParticipating(e) || isControl(e))
      .toSeq.sortBy(_.name)
      .map { e =>
        val value = e.value
        val nameWithValue = s"${e.name}-${value}" // Each experiment variant needs to have a unique name for Ophan
        s""""${CamelCase.fromHyphenated(nameWithValue)}":"${value}""""
      }
      .mkString(",")
  }

  private def isIn(experiment: Experiment)(p: Experiment => Boolean)(implicit request: RequestHeader): Boolean = {
    if(experiment.canRun) LookedAtExperiments.addExperiment(experiment) // Side effect!
    p(experiment)
  }

  def isParticipating(experiment: Experiment)(implicit request: RequestHeader): Boolean =
    if (experiment.name == "audio-page-change") true else isIn(experiment)(_.isParticipating)

  def isControl(experiment: Experiment)(implicit request: RequestHeader): Boolean =
    isIn(experiment)(_.isControl)

  def groupFor(experiment: Experiment)(implicit request: RequestHeader): Participation = {
    if(isParticipating(experiment)){
      Participant
    } else if(isControl(experiment)){
      Control
    } else {
      Excluded
    }
  }
}
