// 楼层浏览页（NavDestination）：六层自由漫游 + 点选节点查看
// ① 楼层 Tabs · ② FloorCanvas（可点选）· ③ 点节点 → 底部弹层显示详情 + 设为目的地
import { MapNode, XHA_NODES, FLOOR_ORDER } from '../model/AirportMap';
import { nodeName, typeLabel, floorName } from '../model/Localization';
import { catSymbol, catOf } from '../model/Categories';
import { Loc } from '../model/Loc';
import { Router, NAV_PLAN } from '../core/Router';
import { APP, TYPE_COLOR } from '../ui/Theme';
import { FloorCanvas } from '../ui/FloorCanvas';

const NODE_BY: Map<string, MapNode> = new Map<string, MapNode>();
for (let i = 0; i < XHA_NODES.length; i++) {
  NODE_BY.set(XHA_NODES[i].id, XHA_NODES[i]);
}

@Component
export struct FloorBrowse {
  @Consume pathStack: NavPathStack;
  @StorageLink('lang') lang: string = 'zh';
  @State floor: string = '4F';
  @State pickedId: string = '';
  @State showDetail: boolean = false;

  aboutToAppear(): void {
    if (Router.browseFloor.length > 0) {
      this.floor = Router.browseFloor;
    }
  }

  // 点选节点：弹出底部详情
  onNodeTap(id: string): void {
    this.pickedId = id;
    this.showDetail = true;
  }

  // 设为目的地 -> 跳路线
  goDest(): void {
    const n = NODE_BY.get(this.pickedId);
    if (n === undefined) {
      this.showDetail = false;
      return;
    }
    Router.endId = n.id;
    Router.endNameZh = n.name;
    Router.endNameEn = nodeName(n, true);
    Router.endFloor = n.floor;
    this.showDetail = false;
    this.pathStack.pushPathByName(NAV_PLAN, null);
  }

  picked(): MapNode | undefined {
    return NODE_BY.get(this.pickedId);
  }

  nodeColor(n: MapNode): string {
    const c = TYPE_COLOR.get(n.type);
    return c === undefined ? APP.accent : c;
  }

  // @Builder 体内不允许局部变量 -> 拆成普通方法（可持有 const），builder 只留 if+组件
  private detailName(): string {
    const n = this.picked();
    return n === undefined ? '' : (this.lang === 'en' ? nodeName(n, true) : n.name);
  }

  private detailSymbol(): string {
    const n = this.picked();
    return n === undefined ? '•' : catSymbol(catOf(n));
  }

  private detailColor(): string {
    const n = this.picked();
    return n === undefined ? APP.accent : this.nodeColor(n);
  }

  private detailType(): string {
    const n = this.picked();
    return n === undefined ? '' : typeLabel(n.type, this.lang === 'en');
  }

  private detailFloor(): string {
    const n = this.picked();
    if (n === undefined) {
      return '';
    }
    return n.floor + ' ' + floorName(n.floor, this.lang === 'en');
  }

  // 设为出发点：仅写 Router.startId，留在本页（供继续挑终点）
  setAsStart(): void {
    const n = this.picked();
    if (n === undefined) {
      this.showDetail = false;
      return;
    }
    Router.startId = n.id;
    this.showDetail = false;
  }

  // 统一点选后的动作：仅关闭弹层（pickedId 由下一次 onNodeTap 覆盖）
  // 不能在此清空 pickedId：本 SDK 弹层内容若变成空树会卡在「空白弹层不关闭」
  @Builder
  detailSheet() {
    Column({ space: 12 }) {
      if (this.pickedId !== '') {
        Row({ space: 10 }) {
          Text(this.detailSymbol())
            .fontSize(24)
            .fontColor(this.detailColor())
          Column({ space: 4 }) {
            Text(this.detailName())
              .fontSize(19)
              .fontWeight(FontWeight.Bold)
              .fontColor(APP.text)
            Row({ space: 6 }) {
              Text(this.detailType())
                .fontSize(12)
                .fontColor(APP.sub)
              Text('·')
                .fontSize(12)
                .fontColor(APP.sub)
              Text(this.detailFloor())
                .fontSize(12)
                .fontColor(APP.sub)
            }
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .width('100%')
        .alignItems(VerticalAlign.Center)
      } else {
        // 占位：保证弹层内容永远非空（空内容会让本 SDK 弹层无法正常关闭）
        Text(' ')
          .fontSize(12)
          .fontColor(APP.sub)
          .width('100%')
      }

      Row({ space: 10 }) {
        Button(Loc.t('pick_start', this.lang === 'en'))
          .height(40)
          .borderRadius(999)
          .backgroundColor(APP.card2)
          .fontColor(APP.text)
          .layoutWeight(1)
          .onClick(() => this.setAsStart())
        Button(Loc.t('pick_dest', this.lang === 'en'))
          .height(40)
          .borderRadius(999)
          .backgroundColor(APP.accent)
          .fontColor(APP.bg)
          .layoutWeight(1)
          .onClick(() => this.goDest())
      }
      .width('100%')

      Button(Loc.t('common_cancel', this.lang === 'en'))
        .height(36)
        .width('100%')
        .backgroundColor(APP.card2)
        .fontColor(APP.sub)
        .onClick(() => {
          this.showDetail = false;
        })
    }
    .width('100%')
    .padding({ left: 20, right: 20, top: 20, bottom: 24 })
    .backgroundColor(APP.bg)
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
          Text(Loc.t('browse_title', this.lang === 'en'))
            .fontSize(19)
            .fontWeight(FontWeight.Bold)
            .fontColor(APP.text)
          Blank()
        }
        .width('100%')
        .height(52)
        .padding({ left: 8, right: 16 })
        .alignItems(VerticalAlign.Center)
        .backgroundColor(APP.bg)

        Tabs({ barPosition: BarPosition.Start }) {
          ForEach(FLOOR_ORDER, (f: string) => {
            TabContent() {
              Column({ space: 6 }) {
                Row() {
                  Text(f + ' · ' + Loc.floor(f, this.lang === 'en'))
                    .fontSize(12)
                    .fontColor(APP.sub)
                  Blank()
                  if (this.floor === f) {
                    Text(Loc.t('browse_tap_hint', this.lang === 'en'))
                      .fontSize(11)
                      .fontColor(APP.sub)
                  }
                }
                .width('100%')
                .padding({ left: 16, right: 16, top: 6, bottom: 4 })

                FloorCanvas({
                  floor: f,
                  lang: this.lang,
                  pathNodeIds: [],
                  viaSecurity: false,
                  isStart: false,
                  isEnd: false,
                  progress: 1,
                  selectable: true,
                  onNodeTap: (id: string) => this.onNodeTap(id)
                })
                .layoutWeight(1)
                .width('100%')
                .borderRadius(14)
                .clip(true)
              }
              .width('100%')
              .height('100%')
            }
            .tabBar(f)
          }, (f: string) => f)
        }
        .barHeight(36)
        .barBackgroundColor(APP.card2)
        .divider({ strokeWidth: 0, color: APP.line })
        .onChange((idx: number) => {
          if (idx >= 0 && idx < FLOOR_ORDER.length) {
            this.floor = FLOOR_ORDER[idx];
          }
        })
        .layoutWeight(1)
      }
      .width('100%')
      .height('100%')
      .backgroundColor(APP.bg)
      .bindSheet(
        $$this.showDetail,
        this.detailSheet(),
        { height: SheetSize.MEDIUM, dragBar: true, showClose: true, backgroundColor: APP.bg }
      )
    }
    .title(Loc.t('browse_title', this.lang === 'en'))
    .hideTitleBar(true)
    .backgroundColor(APP.bg)
    .onBackPressed(() => {
      this.pathStack.pop();
      return true;
    })
  }
}