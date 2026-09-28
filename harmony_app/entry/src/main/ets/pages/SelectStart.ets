// 起点选择页（NavDestination）：快捷起点 + 全节点可选
import { MapNode, XHA_NODES } from '../model/AirportMap';
import { nodeName, typeLabel, floorName } from '../model/Localization';
import { Loc } from '../model/Loc';
import { Router } from '../core/Router';
import { QUICK_STARTS } from '../core/Pathfinder';
import { APP, TYPE_COLOR } from '../ui/Theme';

const NODE_BY: Map<string, MapNode> = new Map<string, MapNode>();
for (let i = 0; i < XHA_NODES.length; i++) {
  NODE_BY.set(XHA_NODES[i].id, XHA_NODES[i]);
}

@Component
export struct SelectStart {
  @Consume pathStack: NavPathStack;
  @StorageLink('lang') lang: string = 'zh';
  @State q: string = '';
  @State list: MapNode[] = [];

  aboutToAppear(): void {
    this.rebuild();
  }

  rebuild(): void {
    const query = this.q.trim();
    const out: MapNode[] = [];
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i];
      if (query.length === 0) {
        out.push(n);
        continue;
      }
      const name = n.name;
      const en = nodeName(n, true);
      if (name.indexOf(query) >= 0 || en.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
        out.push(n);
      }
    }
    this.list = out;
  }

  choose(id: string): void {
    Router.startId = id;
    this.pathStack.pop();
  }

  nodeColor(n: MapNode): string {
    const c = TYPE_COLOR.get(n.type);
    return c === undefined ? APP.accent : c;
  }

  @Builder
  row(n: MapNode) {
    Row({ space: 12 }) {
      // 色点：避免 Circle().fill()（SDK26 新 API）-> 用圆角 Row 实现
      Row()
        .width(12)
        .height(12)
        .borderRadius(6)
        .backgroundColor(this.nodeColor(n))
      Column({ space: 3 }) {
        Text(this.lang === 'en' ? nodeName(n, true) : n.name)
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .fontColor(APP.text)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Row({ space: 6 }) {
          Text(typeLabel(n.type, this.lang === 'en')).fontSize(11).fontColor(APP.sub)
          Text('·').fontSize(11).fontColor(APP.sub)
          Text(n.floor).fontSize(11).fontColor(APP.sub)
          Text(floorName(n.floor, this.lang === 'en')).fontSize(11).fontColor(APP.sub)
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
      if (Router.startId === n.id) {
        Text('✓')
          .fontSize(14)
          .fontColor(APP.gold)
      }
    }
    .width('100%')
    .padding({ left: 14, right: 14, top: 10, bottom: 10 })
    .backgroundColor(Router.startId === n.id ? APP.card2 : APP.card)
    .borderRadius(12)
    .onClick(() => this.choose(n.id))
  }

  @Builder
  quickChip(id: string) {
    if (NODE_BY.get(id) !== undefined) {
      Text(this.chipLabel(id))
        .fontSize(12)
        .fontColor(Router.startId === id ? APP.bg : APP.text)
        .padding({ left: 12, right: 12, top: 8, bottom: 8 })
        .backgroundColor(Router.startId === id ? APP.gold : APP.card2)
        .borderRadius(999)
        .onClick(() => this.choose(id))
    }
  }

  private chipLabel(id: string): string {
    const n = NODE_BY.get(id);
    if (n === undefined) {
      return '';
    }
    return this.lang === 'en' ? nodeName(n, true) : n.name;
  }

  build() {
    NavDestination() {
      Column() {
        Row() {
          Text('‹')
            .fontSize(30)
            .fontColor(APP.text)
            .width(40)
            .height(40)
            .textAlign(TextAlign.Center)
            .onClick(() => this.pathStack.pop())
          Text(Loc.t('sel_pick_start', this.lang === 'en'))
            .fontSize(19)
            .fontWeight(FontWeight.Bold)
            .fontColor(APP.text)
          Blank()
        }
        .width('100%')
        .height(52)
        .padding({ left: 8, right: 16 })
        .alignItems(VerticalAlign.Center)

        TextInput({ placeholder: Loc.t('sel_search', this.lang === 'en') })
          .height(40)
          .borderRadius(12)
          .backgroundColor(APP.card)
          .fontColor(APP.text)
          .placeholderColor(APP.sub)
          .caretColor(APP.accent)
          .padding({ left: 12, right: 12 })
          .margin({ left: 16, right: 16, bottom: 10 })
          .onChange((v: string) => {
            this.q = v;
            this.rebuild();
          })

        // 快捷起点（模拟当前位置：出发门/到达出口/地铁站台等）
        Column({ space: 8 }) {
          Text(Loc.t('sel_quick_start', this.lang === 'en'))
            .fontSize(12)
            .fontColor(APP.sub)
            .width('100%')
          Scroll() {
            Row({ space: 8 }) {
              ForEach(QUICK_STARTS, (id: string) => {
                this.quickChip(id)
              }, (id: string) => id)
            }
          }
          .scrollable(ScrollDirection.Horizontal)
          .scrollBar(BarState.Off)
          .width('100%')
        }
        .width('100%')
        .padding({ left: 16, right: 16, bottom: 12 })

        // 全部节点
        List({ space: 6 }) {
          ForEach(this.list, (n: MapNode) => {
            ListItem() {
              this.row(n)
            }
          }, (n: MapNode) => n.id)
        }
        .layoutWeight(1)
        .width('100%')
        .padding({ left: 16, right: 16, bottom: 16 })
        .scrollBar(BarState.Off)
        .edgeEffect(EdgeEffect.None)
      }
      .width('100%')
      .height('100%')
      .backgroundColor(APP.bg)
    }
    .title(Loc.t('sel_pick_start', this.lang === 'en'))
    .hideTitleBar(true)
    .onBackPressed(() => {
      this.pathStack.pop();
      return true;
    })
  }
}