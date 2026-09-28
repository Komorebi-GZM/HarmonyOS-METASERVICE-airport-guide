// 地铁换乘引导页（NavDestination）
// ① 方向选择卡片（往市区 / 往星湖度假区）· ② 三步指引 · ③ 站台层 FloorCanvas 预览
// 点方向 → 设定 Router 终点为此站台并跳转路线页
import { Loc } from '../model/Loc';
import { Router, NAV_PLAN } from '../core/Router';
import { APP } from '../ui/Theme';
import { FloorCanvas } from '../ui/FloorCanvas';

@Component
export struct MetroGuide {
  @Consume pathStack: NavPathStack;
  @StorageLink('lang') lang: string = 'zh';
  @State dir: string = 'city'; // city / resort 已选方向

  // 选择一个方向：终点=对应站台
  choose(platId: string, nameZh: string, nameEn: string, dir: string): void {
    Router.endId = platId;
    Router.endNameZh = nameZh;
    Router.endNameEn = nameEn;
    Router.endFloor = 'B2';
    Router.metroDir = dir;
    this.dir = dir;
    this.pathStack.pushPathByName(NAV_PLAN, null);
  }

  @Builder
  dirCard(platId: string, nameZh: string, nameEn: string, dir: string, symbol: string) {
    Column({ space: 8 }) {
      Row({ space: 8 }) {
        Text(symbol)
          .fontSize(22)
          .fontColor('#5B4A9E')
        Text(this.lang === 'en' ? nameEn : nameZh)
          .fontSize(16)
          .fontWeight(FontWeight.Bold)
          .fontColor(APP.text)
      }
      .width('100%')
      .alignItems(VerticalAlign.Center)
      Text(Loc.t('metro_plat_sub', this.lang === 'en'))
        .fontSize(11)
        .fontColor(APP.sub)
        .width('100%')
    }
    .padding(14)
    .backgroundColor(this.dir === dir ? APP.card2 : APP.card)
    .borderRadius(14)
    .border({ width: 1, color: this.dir === dir ? '#5B4A9E' : APP.line })
    .layoutWeight(1)
    .alignItems(HorizontalAlign.Start)
    .onClick(() => this.choose(platId, nameZh, nameEn, dir))
  }

  @Builder
  stepCard(no: string, titleKey: string, descKey: string) {
    Row({ space: 10 }) {
      Text(no)
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor(APP.bg)
        .width(22)
        .height(22)
        .textAlign(TextAlign.Center)
        .borderRadius(999)
        .backgroundColor(APP.gold)
      Column({ space: 2 }) {
        Text(Loc.t(titleKey, this.lang === 'en'))
          .fontSize(13)
          .fontWeight(FontWeight.Medium)
          .fontColor(APP.text)
        Text(Loc.t(descKey, this.lang === 'en'))
          .fontSize(11)
          .fontColor(APP.sub)
          .width('100%')
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)
    }
    .width('100%')
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
          Text(Loc.t('metro_title', this.lang === 'en'))
            .fontSize(19)
            .fontWeight(FontWeight.Bold)
            .fontColor(APP.text)
          Blank()
        }
        .width('100%')
        .height(52)
        .padding({ left: 8, right: 16 })
        .alignItems(VerticalAlign.Center)

        // 方向选择
        Column({ space: 8 }) {
          Text(Loc.t('metro_hint', this.lang === 'en'))
            .fontSize(12)
            .fontColor(APP.sub)
            .width('100%')
          Row({ space: 10 }) {
            this.dirCard('xha_b2_platA', '站台·往市区方向', 'Platform · City Center', 'city', '◆')
            this.dirCard('xha_b2_platB', '站台·往星湖度假区', 'Platform · Xinghu Resort', 'resort', '◈')
          }
          .width('100%')
        }
        .width('100%')
        .padding({ left: 16, right: 16, bottom: 14 })

        // 三步指引
        Column({ space: 12 }) {
          this.stepCard('1', 'metro_step_gate_t', 'metro_step_gate_d')
          this.stepCard('2', 'metro_step_descend_t', 'metro_step_descend_d')
          this.stepCard('3', 'metro_step_plat_t', 'metro_step_plat_d')
        }
        .width('100%')
        .padding(16)
        .backgroundColor(APP.card)
        .borderRadius(14)
        .alignItems(HorizontalAlign.Start)
        .margin({ left: 16, right: 16 })

        // 站台层预览（B2）
        Column({ space: 6 }) {
          Row() {
            Text('B2 · ' + Loc.floor('B2', this.lang === 'en'))
              .fontSize(12)
              .fontColor(APP.sub)
            Blank()
          }
          .width('100%')
          FloorCanvas({
            floor: 'B2',
            lang: this.lang,
            pathNodeIds: [],
            viaSecurity: false,
            isStart: false,
            isEnd: false,
            progress: 1,
            selectable: false,
            onNodeTap: (id: string) => {
            }
          })
          .width('100%')
          .height(220)
          .borderRadius(14)
          .clip(true)
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 16 })
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)
      }
      .width('100%')
      .height('100%')
      .backgroundColor(APP.bg)
    }
    .title(Loc.t('metro_title', this.lang === 'en'))
    .hideTitleBar(true)
    .onBackPressed(() => {
      this.pathStack.pop();
      return true;
    })
  }
}