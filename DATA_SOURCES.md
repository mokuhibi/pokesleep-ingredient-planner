# データの出典・利用条件

確認日：2026-10-07。これは出典台帳であり、未確認の権利を許可済みと扱うものではない。
現在のアプリは既に公開中。今回の整理によって「全データの一般公開条件が確認済み」になるわけではない。

## 採用方針とライセンスの境界

- 本ファイルを出典台帳の入口とする。実行時の版・更新日・URLは `data.js: meta` にも保持する。
- 計算・数値・表示名・内部ID・保存形式は2026-10-07の整理で変更していない。
- Neroli由来の実装・データにはApache-2.0の表記がある。他の取得元へ自動的に適用しない。
- 日本語名称は表示用。個体のspecies、食材slots、nature、subskills、担当、進化先はIDで保存・比較する。customNameとnicknameは利用者の記録であり翻訳マスターではない。
- 未確認の条件を「公開ページなので利用可能」と判断しない。ソフトウェアの許諾と原作画像・商標・元資料の権利を区別する。
- 新しいデータは、取得元、固定版、対象フィールド、利用条件、クレジット、変更内容をここに記録してから追加する。

## 使用中のデータ

N = Neroli’s Lab採用版 `647ddf8167fb8ae2295769ea70914af125f16a79`。
URL：https://github.com/nerolis-lab/nerolis-lab/tree/647ddf8167fb8ae2295769ea70914af125f16a79
採用リポジトリ更新：2026-09-30T01:38:33Z。初回確認：2026-09-30。
個別更新日は `data.js: meta.sources`、マップ/リボン等は `mapRibbonSource` / `favoredBerrySource` を参照。未記録の日付は不明のまま保持する。

| カテゴリ | 使用箇所 | 取得元・元ファイル | 採用版・確認日 | 条件・クレジット | 変更内容・未確認項目 |
|---|---|---|---|---|---|
| 元の247種族：得意、速度、食材候補/個数、基礎所持数、進化、きのみ | data.js pokemon | N: common/src/types/pokemon/__snapshots__/pokemon.test.ts.snap、各種族定義 | N / 2026-09-30、進化2026-10-01、きのみ2026-10-03 | Apache-2.0対象部分、Neroli帰属・LICENSE・NOTICE保持 | フィールド抽出、ID化。特殊枠は未対応として数値を出さない |
| 基礎食材確率 | data.js pokemon.ingredientRate | N。pokemon.tsコメントはMathcord RP data projectを参照 | N | Neroli部分Apache-2.0。原資料の再利用条件は未確認 | パーセントを小数へ変換。原資料：https://docs.google.com/spreadsheets/d/1kBrPl0pdAO8gjOf_NrTgAPseFtqQA27fdfEbMBBeAhs/edit |
| 食材ID・一覧 | data.js ingredients | N: common/src/types/ingredient/ingredients.ts | N | Neroli部分Apache-2.0 | 名前・絵文字は別の表示対応表。実行用データに食材エナジー値はない |
| 性格の補正対象・数値 | data.js natures | N: common/src/types/nature/nature.ts | N | Neroli部分Apache-2.0 | 日本語名は別扱い |
| サブスキルの効果・レアリティ | data.js subskills | N: common/src/types/subskill/subskills.ts | N | Neroli部分Apache-2.0 | 日本語名は別扱い |
| レシピカテゴリ・必要食材/個数 | data.js recipes | N: common/src/types/recipe/curry.ts、salad.ts、dessert.ts | N | Neroli部分Apache-2.0 | 日本語名の照合元はWiki。料理エナジー表は未搭載 |
| きのみID・タイプ・基礎エナジー | data.js berries | N: common/src/types/berry/berries.ts | N / 2026-10-03 | Neroli部分Apache-2.0 | 名前・旧iconパスは別扱い |
| マップ・固定好物・ランダム/EX区分 | data.js maps | N: common/src/types/island/islands/、island.ts | N / 2026-10-06 | Neroli部分Apache-2.0 | 日本語名は別扱い。ランダム好物は利用者が選択 |
| リボン段階/時間・間隔/所持数補正 | data.js ribbons | N: common/src/types/ribbon/ribbon.ts、common/src/utils/stat-utils/stat-utils.ts | N / 2026-10-06 | Neroli部分Apache-2.0 | 累積効果を表へ変換。所持数増加は満杯前回収モデルでは不使用 |
| 速度・げんき・食材抽選・きのみ量/成長・キャンプ | core.js | N: backend/src/services/calculator/help/help-calculator.ts、energy/energy-calculator.ts、production/produce-calculator.ts、common/src/utils/stat-utils/stat-utils.ts、berry-utils/berry-utils.ts、member-state/member-state.ts | N。meta.sourcesに日時 | Neroli部分Apache-2.0 | 固定げんき24時間の解析期待値、チーム/スキル除外、欠損時停止、対象別進化比較に改変 |
| 好きなきのみ基本倍率 | data.js berryModifiers、core.js | N: common/src/types/constants.ts、backend/src/services/simulation-service/team-simulator/strength-calculator/strength-calculator.ts | N / 2026-10-06 | Neroli部分Apache-2.0 | マップのみ基本2倍。イベント・EX追加効果等は未反映 |
| 追加2種 | data.js pokemon、meta.speciesAdditions | RaenonX種族ページ | raenonx-20261005 / 2026-10-05、元ページ更新日不明 | 利用条件・商用利用・改変・再配布・帰属要否は未確認 | 下記のフィールド一覧。Apache-2.0に含めない |

Neroliの元ソースには、RaenonX・Goobliss・Nitoyon等への謝辞がある。個々の数値と提供者の対応、原資料の許可書は確認できない。NeroliのLICENSE確認は第三者資料の権利処理の保証ではない。

## RaenonX由来の現在の記録と置換候補

取得URL：
- https://pks.raenonx.cc/ja/pokedex/590
- https://pks.raenonx.cc/ja/pokedex/591
- 追加告知の確認：https://www.pokemonsleep.net/news/343430323735343731303033383131383431/

現在の2行には `sourceId: raenonx-20261005` が付いている。個々のフィールドの取得元タグはないため、次のように区別する。

| フィールド | タマゲタケ | モロバレル | 出典の扱い |
|---|---|---|---|
| id / name / english / dex | FOONGUS / タマゲタケ / Foongus / 590 | AMOONGUSS / モロバレル / Amoonguss / 591 | 識別・表示。追加依頼と種族ページの対応。ポケモン基本日本語名は下記PokéAPIとも一致 |
| specialty | ingredient | ingredient | 食材とくいとしての追加依頼、種族ページの記録 |
| frequency | 5700秒 | 3500秒 | RaenonX採用数値 |
| ingredientRate | 0.174 | 0.204 | RaenonX採用数値 |
| slots[0] | Mushroom 2 | Mushroom 2 | RaenonX採用構成・個数 |
| slots[1] | Mushroom 5 / Egg 7 | 同左 | 同上 |
| slots[2] | Mushroom 7 / Egg 10 / Tomato 11 | 同左 | 同上 |
| remainingEvolutions / evolvesInto | 1 / AMOONGUSS | 0 / 空配列 | 進化系統としての追加依頼、種族ページの記録 |
| berry | CHESTO | CHESTO | 追加行の対応データ。フィールド単位の独立出典は記録されていない |
| carry | null | null | 出典間不一致で未確認。推測値ではない |
| sourceId / unverifiedFields | raenonx-20261005 / carry | 同左 | アプリ独自の出典管理情報。性能値ではない |

置換候補（未採用）：Neroli `74e5068c1fa76518803caa8705798389da7f635d`。
更新：2026-10-06T04:00:48Z、確認：2026-10-07。
https://github.com/nerolis-lab/nerolis-lab/tree/74e5068c1fa76518803caa8705798389da7f635d
対象：common/src/types/pokemon/ingredient-pokemon.ts と __snapshots__/pokemon.test.ts.snap。
同じ固定版のLICENSEもApache-2.0として確認。速度・確率・食材個数・進化・きのみは現在値と一致する。carryは12/14が存在するが、今回のnullは維持する。
提案：将来この2種だけを新Neroli固定版へ切り替える。全247種や計算式の一括更新は不要。原資料の権利条件が全て解決したと断定しない。今回は採用元も数値も変更していない。

## 日本語名称：現在の由来と統一候補

PokéAPI候補固定版：`2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72`、更新2026-10-06T13:23:56Z、確認2026-10-07。
https://github.com/PokeAPI/pokeapi/tree/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72
LICENSE.md：BSD-3-Clause。licenses/PokeAPI-BSD-3-Clause.txtに原文を同梱。
商用利用・改変・再配布を許可、著作権/条件/免責を保持、PokéAPIや寄稿者による無断推薦表示は禁止。原作商標の別権利は含まない。

| 名称カテゴリ | 現在の取得元・版 | 条件 | 統一候補・今回の判断 |
|---|---|---|---|
| ポケモン基本名 | PokéAPI pokemon_species_names.csv、2026-09-30取得・当時の固定版未記録 | 当時の条件は記録不足 | 上記固定版のlocal_language_id=1と全249行の基本名一致を確認。再照合版・LICENSEを記録するが表示値は変更しない。形態接尾辞はローカル表示対応表 |
| 食材名・料理名 | https://wikiwiki.jp/poke_sleep/料理/レシピの一覧 、2026-10-01照合、更新日不明 | 不明 | 同じSleep固有日本語名称を網羅する許諾明確な代替は確認できず。維持・未確認扱い |
| きのみ名 | https://wikiwiki.jp/poke_sleep/きのみ 、2026-10-03照合、更新日不明 | 不明 | PokéAPI item_names等は候補だがSleepの18きのみIDとの全件対応・採用条件を未検証。維持 |
| 性格名 | ローカル手書き対応表、個別出典不明 | 不明 | PokéAPI nature_names.csvに25件の日本語候補あり。英語IDとの全件対応検証後に統一を提案。今回は置換しない |
| サブスキル名 | ローカル手書き対応表、個別出典不明 | 不明 | Sleep固有。許諾明確な日本語代替は確認できず。維持 |
| タイプ名 | berries.jsの手書き対応表、個別出典不明 | 不明 | PokéAPI type_names.csvに日本語候補あり。アプリの18英語タイプIDとの全件照合前なので未採用 |
| マップ名 | 手書き対応表。アンバーは公式告知参照あり | 不明 | Sleep固有。許諾明確な日本語代替は確認できず。維持 |

公式アンバー参照：https://www.pokemonsleep.net/news/333234393736353333383231313934323431/
公式キャンプ参照：https://app-psl.pokemon-support.com/hc/en-us/articles/29517911255065-My-Good-Camp-Set-isn-t-taking-effect
上限/解放参照：https://www.pokemonsleep.net/es-ES/news/343133383535303430323130343638383731/
公開告知・サポートの参照は、表や画像の自由な再配布許可を意味しない。

## ゲーム画像

- assets/pokemon/*.png：PokeAPI/sprites `1aa1b0ca273d0e096469a9846155484920b11b45`、2026-10-01取得。CC0表記とPokémon Companyの画像著作権表記が併存。原作画像の利用許諾は不明。
- assets/berries/*.png：NeroliのN固定版 frontend/public/images/berries、2026-10-03取得。図柄はPokémonに帰属。画像固有の利用条件は不明。
- 2026-10-07：未使用のポケモンPNG231枚・きのみPNG18枚を現行ツリーとPages配布から削除。未使用portrait関数も削除。文字・タイプバッジ・既存食材絵文字を維持。新しいゲーム画像は取得していない。
- data.js berries.iconの旧パスは過去の取得情報として保持し、UI・共有は参照しない。PNG再同梱は禁止。画像取得記録と旧ライセンスは履歴の説明として保持。
- Gitの過去コミットには旧PNGが残る。今回、履歴改変や別リポジトリへの移動はしない。過去履歴の再配布範囲は公開前の別判断事項。
- 利用者提供のアプリアイコンはゲーム画像と別であり、変更しない。絵文字の描画は端末のフォントによる。

## 公開物のLICENSE・NOTICE・変更通知

- licenses/Apache-2.0.txtとlicenses/NOTICE.txtをPagesでも配信する。Neroliの原帰属を保持する。
- data.js冒頭は混在出典と対象範囲を明記。RaenonX追加や全日本語名までApache-2.0と宣言しない。
- core.js冒頭に抽出後の速度/固定げんき/進化/きのみ/マップ計算等の変更を明記。
- PokéAPI基本名の再照合版LICENSE原文を追加しNOTICEにも帰属を記載。
- 設定の「データの出典と利用条件」から本ファイルを開ける。READMEもここへリンクする。
- 画像由来の旧ライセンスを保持しても、現在の画像利用許可を主張するものではない。

## 変更履歴

| 日付・コミット | 内容 |
|---|---|
| a71b652 | 元Neroliマスター・計算・Apache/NOTICE同梱 |
| 9feffeb | 進化・キャンプ参照 |
| 1a18cca | きのみ、Wiki日本語名、旧画像取得 |
| 24cf132 | RaenonX追加2種 |
| d3b8fd2 | マップ・リボン |
| e898d1d | 好きなきのみ基本倍率 |
| 2026-10-07 | 出典台帳、混在ライセンス明示、PokéAPI基本名再照合版とLICENSE、未使用ゲームPNG削除。数値・ID・名称・計算・保存形式は不変。代替元への切り替えは未実施 |

## 未解決・公開前の確認事項

1. RaenonX追加行の利用条件。新Neroli版への限定切り替えは別途採用判断を行う。
2. Mathcord等の元資料の条件、Neroliからの取得によって許諾される範囲。
3. Wikiで照合した日本語名、出典不明のSleep固有日本語名の取得根拠・利用条件。
4. PokéAPIの性格/タイプ/きのみ名称のID対応と適用条件の確認。全カテゴリを統一できるとは断定しない。
5. 原作の名称・商標・ゲーム画像の別権利。ソフトウェアLICENSEだけで解決したとしない。
6. 公開Git履歴に残る旧画像の扱い。現行削除は全履歴削除ではない。

確認できない値を補完しない。計算バグが別途見つかった場合は、本整理の修正に混ぜず報告する。
