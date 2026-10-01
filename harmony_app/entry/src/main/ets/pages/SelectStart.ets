import { PlacePicker } from '../ui/PlacePicker';
import { APP } from '../ui/Theme';
import { PlannerState, cancelEdit } from '../core/PlannerState';
@Component
export struct SelectStart {
  @Consume pathStack: NavPathStack;
  @Consume planner: PlannerState;
  build() {
    NavDestination() {
      Row() { PlacePicker({ start: true }) }
        .width('100%').height('100%').justifyContent(FlexAlign.Center)
    }
      .hideTitleBar(true).backgroundColor(APP.bg)
      .onBackPressed((): boolean => {
        if (this.planner.editing !== 'new') { this.planner = cancelEdit(this.planner); }
        return false;
      })
  }
}
