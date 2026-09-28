// 路线页（NavDestination）：起点→终点 的跨层导航结果
// ① 摘要卡（全程米数 / 安检必经 / 换层次数）· ② 寻路偏好 chips · ③ 逐层 Tabs（FloorCanvas + 动效）
// ④ 换层 banner 列表 · 动效：路线白描边红头逐段绘制（progress 0→1）
import { nodeName } from '../model/Localization';
import { Loc } from '../model/Loc';
import { Router } from '../core/Router';
import { Route as PlannerRoute, RouteLeg, RouteTransition, planRoute, node, PREF_SHORTEST, PREF_ELEVATOR, PREF_ESCALATOR, PREF_AVOID_STAIR } from '../core/Pathfinder';
import { APP } from '../ui/Theme';
import { FloorCanvas } from '../ui/FloorCanvas';

@Component
export struct Route {
  @Consume pathStack: NavPathStack;
  @StorageLink('lang') lang: string = 'zh';
  @State route: PlannerRoute = { nodeIds: [], totalMeters: 0, legs: [], transitions: [], viaSecurity: false };
  @State pref: number = PREF_SHORTEST;
  @State progress: number = 0;
  @State curFloor: string = '';

  // 动效定时器句柄
  private timer: number = -1;

  aboutToAppear(): void {
    this.replan();
  }

  aboutToDisappear(): void {
    if (this.timer >= 0) {
      clearInterval(this.timer);
      this.timer = -1;
    }
  }

  // 依据 Router 起终点 + 当前偏好重新寻路，并重启动画
  replan(): void {
    this.route = planRoute(Router.startId, Router.endId, this.pref);
    if (this.route.legs.length > 0) {
      this.curFloor = this.route.legs[0].floor;
    }
    this.startAnim();
  }

  setPref(p: number): void {
    if (p === this.pref) {
      return;
    }
    this.pref = p;
    this.replan();
  }

  // 动画：progress 0→1 循环（重画路线）
  startAnim(): void {
    if (this.timer >= 0) {
      clearInterval(this.timer);
      this.timer = -1;
    }
    this.progress = 0;
    this.timer = setInterval(() => {
      this.progress += 0.02;
      if (this.progress > 1) {
        this.progress = 1;
        clearInterval(this.timer);
        this.timer = -1;
      }
    }, 16); // ~800ms
  }

  // 终点展示名
  endName(): string {
    if (Router.endNameZh.length === 0) {
      return '';
    }
    return this.lang === 'en' && Router.endNameEn.length > 0 ? Router.endNameEn : Router.endNameZh;
  }

  startName(): string {
    return this.lang === 'en' ? nodeName(node(Router.startId), true) : nodeName(node(Router.startId), false);
  }

  // 某楼层 leg 是不是含起点/终点
  legIsStart(leg: RouteLeg): boolean {
    return leg.nodeIds.length > 0 && leg.nodeIds[0] === Router.startId;
  }

  legIsEnd(leg: RouteLeg): boolean {
    const ids = leg.nodeIds;
    return ids.length > 0 && ids[ids.length - 1] === Router.endId;
  }

  verticalName(t: string, en: boolean): string {
    if (t === 'elevator') {
      return Loc.t('route_by_elevator', en);
    }
    if (t === 'escalator') {
      return Loc.t('route_by_escalator', en);
    }
    return Loc.t('route_by_stair', en);
  }

  @Builder
  prefChip(p: number, labelKey: string) {
    Text(Loc.t(labelKey, this.lang === 'en'))
      .fontSize(12)
      .fontColor(this.pref === p ? APP.bg : APP.text)
      .padding({ left: 12, right: 12, top: 6, bottom: 6 })
      .backgroundColor(this.pref === p ? APP.accent : APP.card2)
      .borderRadius(999)
      .onClick(() => this.setPref(p))
  }

  @Builder
  summaryCard() {
    Row({ space: 10 }) {
      Column({ space: 2 }) {
        Text(Loc.t('route_total', this.lang === 'en'))
          .fontSize(11)
          .fontColor(APP.sub)
        Row({ space: 2 }) {
          Text(Math.round(this.route.totalMeters) + '')
            .fontSize(24)
            .fontWeight(FontWeight.Bold)
            .fontColor(APP.gtext)
          Text(Loc.t('route_meters', this.lang === 'en'))
            .fontSize(12)
            .fontColor(APP.sub)
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      // 途经楼层数 / 换层次数
      Column({ space: 2 }) {
        Text(this.route.legs.length + 'F')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor(APP.accentSoft)
        Text(Loc.t('route_levels', this.lang === 'en'))
          .fontSize(11)
          .fontColor(APP.sub)
      }
      Column({ space: 2 }) {
        Text(this.route.transitions.length + '')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor(APP.accentSoft)
        Text(Loc.t('trans_count', this.lang === 'en'))
          .fontSize(11)
          .fontColor(APP.sub)
      }
    }
    .width('100%')
    .padding(14)
    .backgroundColor(APP.card)
    .borderRadius(14)
  }

  @Builder
  securityBadge() {
    Row({ space: 6 }) {
      Text('⚠')
        .fontSize(12)
        .fontColor(APP.gtext)
      Text(this.route.viaSecurity ? Loc.t('route_via_security', this.lang === 'en') : Loc.t('route_same_side', this.lang === 'en'))
        .fontSize(12)
        .fontColor(APP.gtext)
    }
    .width('100%')
    .padding({ left: 12, right: 12, top: 8, bottom: 8 })
    .backgroundColor(APP.card2)
    .borderRadius(10)
  }

  @Builder
  transitionBanner(idx: number) {
    if (idx >= 0 && idx < this.route.transitions.length) {
      Row({ space: 8 }) {
        Text('⇅')
          .fontSize(14)
          .fontColor(APP.sub)
        Text(Loc.t('route_transfer_to', this.lang === 'en'))
          .fontSize(11)
          .fontColor(APP.sub)
        Text(this.transName(idx))
          .fontSize(12)
          .fontColor(APP.text)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Blank()
        Text(this.transFloors(idx))
          .fontSize(11)
          .fontColor(APP.accentSoft)
      }
      .width('100%')
      .padding({ left: 12, right: 12, top: 8, bottom: 8 })
      .backgroundColor(APP.card)
      .borderRadius(10)
      .border({ width: 1, color: APP.line })
    }
  }

  // @Builder 体内不允许局部变量 -> 拆成普通方法（可持有 const）
  private transName(idx: number): string {
    const tr = this.route.transitions[idx];
    return tr === undefined ? '' : tr.viaName;
  }

  private transFloors(idx: number): string {
    const tr = this.route.transitions[idx];
    if (tr === undefined) {
      return '';
    }
    return Loc.floor(tr.fromFloor, this.lang === 'en') + ' → ' + Loc.floor(tr.toFloor, this.lang === 'en');
  }

  build() {
    NavDestination() {
      Column() {
        // 顶部
        Row() {
          Text('‹')
            .fontSize(30)
            .fontColor(APP.text)
            .width(40)
            .height(40)
            .textAlign(TextAlign.Center)
            .onClick(() => this.pathStack.pop())
          Column({ space: 1 }) {
            Text(this.endName())
              .fontSize(19)
              .fontWeight(FontWeight.Bold)
              .fontColor(APP.text)
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
            Text(this.startName() + ' · ' + Loc.t('route_title', this.lang === 'en'))
              .fontSize(11)
              .fontColor(APP.sub)
              .maxLines(1)
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .width('100%')
        .height(52)
        .padding({ left: 8, right: 16 })
        .alignItems(VerticalAlign.Center)

        if (this.route.nodeIds.length === 0) {
          Column({ space: 8 }) {
            Text('⛔').fontSize(30)
            Text(Loc.t('route_no_path', this.lang === 'en'))
              .fontSize(13)
              .fontColor(APP.sub)
          }
          .layoutWeight(1)
          .width('100%')
          .justifyContent(FlexAlign.Center)
        } else {
          Column({ space: 10 }) {
            this.summaryCard()
            this.securityBadge()

            // 偏好
            Column({ space: 6 }) {
              Text(Loc.t('common_pref', this.lang === 'en'))
                .fontSize(11)
                .fontColor(APP.sub)
                .width('100%')
              Row({ space: 8 }) {
                this.prefChip(PREF_SHORTEST, 'pref_shortest')
                this.prefChip(PREF_ELEVATOR, 'pref_elevator')
                this.prefChip(PREF_ESCALATOR, 'pref_escalator')
                this.prefChip(PREF_AVOID_STAIR, 'pref_avoid_stair')
              }
            }
            .width('100%')
            .alignItems(HorizontalAlign.Start)
          }
          .width('100%')
          .padding({ left: 16, right: 16 })
          .alignItems(HorizontalAlign.Start)

          // 逐层路径 Tabs（动效画布）
          Tabs({ barPosition: BarPosition.Start, index: this.floorIndex() }) {
            ForEach(this.route.legs, (leg: RouteLeg, i: number) => {
              TabContent() {
                Column() {
                  Row() {
                    Text(leg.floor + ' · ' + Loc.floor(leg.floor, this.lang === 'en'))
                      .fontSize(12)
                      .fontColor(APP.sub)
                    Blank()
                    Text(Math.round(leg.meters) + ' ' + Loc.t('route_meters', this.lang === 'en'))
                      .fontSize(12)
                      .fontColor(APP.sub)
                  }
                  .width('100%')
                  .padding({ left: 16, right: 16, top: 6, bottom: 4 })

                  FloorCanvas({
                    floor: leg.floor,
                    lang: this.lang,
                    pathNodeIds: leg.nodeIds,
                    viaSecurity: this.route.viaSecurity,
                    isStart: this.legIsStart(leg),
                    isEnd: this.legIsEnd(leg),
                    progress: this.progress,
                    selectable: false,
                    onNodeTap: (id: string) => {
                    }
                  })
                  .layoutWeight(1)
                  .width('100%')

                  // 本层换层出口提示
                  if (this.routingNote(leg) !== '') {
                    Text(this.routingNote(leg))
                      .fontSize(11)
                      .fontColor(APP.sub)
                      .width('100%')
                      .padding({ left: 16, right: 16, top: 4, bottom: 8 })
                  }
                }
                .width('100%')
                .height('100%')
              }
              .tabBar(leg.floor)
            }, (leg: RouteLeg, i: number) => leg.floor + ':' + i)
          }
          .barHeight(36)
          .barBackgroundColor(APP.card2)
          .divider({ strokeWidth: 0, color: APP.line })
          .onChange((idx: number) => {
            if (idx >= 0 && idx < this.route.legs.length) {
              this.curFloor = this.route.legs[idx].floor;
            }
          })
          .layoutWeight(1)

          // 换层 banner
          if (this.route.transitions.length > 0) {
            Column({ space: 6 }) {
              ForEach(this.route.transitions, (tr: RouteTransition, i: number) => {
                this.transitionBanner(i)
              }, (tr: RouteTransition, i: number) => tr.fromId + ':' + tr.toId + ':' + i)
            }
            .width('100%')
            .padding({ left: 16, right: 16, top: 8, bottom: 12 })
          } else {
            Blank()
          }
        }
      }
      .width('100%')
      .height('100%')
      .backgroundColor(APP.bg)
    }
    .title(this.endName())
    .hideTitleBar(true)
    .onBackPressed(() => {
      this.pathStack.pop();
      return true;
    })
  }

  private floorIndex(): number {
    let best = 0;
    for (let i = 0; i < this.route.legs.length; i++) {
      if (this.route.legs[i].floor === this.curFloor) {
        best = i;
      }
    }
    return best;
  }

  // 本层离开点提示（若有换层导出的下一层）
  private routingNote(leg: RouteLeg): string {
    const floor = leg.floor;
    // 终点在本层且后面无换层：提示直达
    if (this.legIsEnd(leg)) {
      return Loc.t('route_arrived', this.lang === 'en');
    }
    // 找下一个换层：本层最后节点是换层起点
    const ids = leg.nodeIds;
    if (ids.length < 2) {
      return '';
    }
    const lastId = ids[ids.length - 1];
    for (let i = 0; i < this.route.transitions.length; i++) {
      const tr = this.route.transitions[i];
      if (tr.fromId === lastId) {
        const via = this.verticalName(tr.viaType, this.lang === 'en');
        return (this.lang === 'en' ? 'Take ' + via + ' → ' : '乘 ' + via + ' → ') + Loc.floor(tr.toFloor, this.lang === 'en');
      }
    }
    return '';
  }
}