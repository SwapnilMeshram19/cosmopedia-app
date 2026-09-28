import React from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { T, useT, Header, BackBtn, Kicker, Diamond, Toggle, Grid, StatGrid, Chip, ChipRow, Btn, Stripes, Img, MoonDisc } from '../components/ui';
import { FONTS } from '../theme';
import { ObjCard } from './ExploreScreen';
import { NewsRow } from './NewsScreen';

function ListRow({ m, dot, last }) {
  const th = useT();
  return (
    <Pressable onPress={m.go} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: th.surface, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.ink(0.06) }}>
      <Diamond color={dot} />
      <View style={{ flex: 1, gap: 2 }}>
        <T size={15} w={600}>{m.label}</T>
        <T size={12.5} color={th.muted}>{m.sub}</T>
      </View>
      <T color={th.muted2}>→</T>
    </Pressable>
  );
}

function MoreHome({ v }) {
  const th = useT(), tx = v.tx, rank = v.rank;
  const toggleRow = (title, sub, on, toggle, last) => (
    <View style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: th.surface, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.ink(0.06) }}>
      <View style={{ flex: 1, gap: 2 }}><T size={14} w={600}>{title}</T><T size={12.5} color={th.muted}>{sub}</T></View>
      <Toggle on={on} onPress={toggle} />
    </View>
  );
  return (
    <View style={{ gap: 18 }}>
      <Header kicker="Cosmopedia" title={tx.moreTitle} />
      <Pressable onPress={v.openBadges} style={{ borderRadius: 20, padding: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: 'rgba(240,180,106,.3)', gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T mono w={500} size={10.5} ls={0.14} color={th.amber}>{tx.yourRank}</T>
          <T mono w={500} size={11} color={th.muted}>{rank.badgeCount} {tx.badgesWord}</T>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T size={26} w={700}>{rank.name}</T>
          <T mono w={500} size={13}>{rank.xp} XP</T>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: th.ink(0.08), overflow: 'hidden' }}>
          <View style={{ height: '100%', width: rank.pct, backgroundColor: th.amber }} />
        </View>
        <T size={12.5} color={th.muted}>{rank.toNext}</T>
      </Pressable>

      <Kicker>{tx.exploreMore}</Kicker>
      <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: th.ink(0.06) }}>
        {v.moreItems.map((m, i) => <ListRow key={m.id} m={m} dot={th.amber} last={i === v.moreItems.length - 1} />)}
      </View>

      {!!v.adTest && (<>
        <Kicker color={th.green}>AdMob testing (hidden in production)</Kicker>
        <View style={{ borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: th.green, padding: 14, gap: 10 }}>
          <T size={12.5} lh={1.45} color={th.muted}>Google test ads are on. Banners appear on Explore, topic pages and News.</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn label="Rewarded ad" onPress={v.adTest.rewarded} variant="amber" height={40} size={13} style={{ flex: 1 }} />
            <Btn label="Interstitial" onPress={v.adTest.interstitial} height={40} size={13} style={{ flex: 1 }} />
          </View>
          <Btn label="Open Ad Inspector" onPress={v.adTest.inspector} variant="outlineBlue" height={40} size={13} />
          <Btn label="Test background news alert" onPress={v.adTest.testNewsTask} variant="outlineBlue" height={40} size={13} />
        </View>
      </>)}

      <Kicker>{tx.settings}</Kicker>
      <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: th.ink(0.06) }}>
        {v.settingsItems.map((m) => <ListRow key={m.id} m={m} dot={th.blue} />)}
        {toggleRow(tx.breaking, tx.breakingSub, v.alertsOn, v.toggleAlerts)}
        {toggleRow(tx.issNearby, tx.issNearbySub, v.issAlertsOn, v.toggleIssAlerts, true)}
      </View>
    </View>
  );
}

function Saved({ v }) {
  const th = useT(), tx = v.tx;
  const card = { borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) };
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={tx.library} title={tx.savedTitle} />
      {v.savedEmpty && (
        <View style={[card, { paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 6 }]}>
          <T size={17} w={600} align="center">{tx.nothingSaved}</T>
          <T size={14} color={th.muted} lh={1.5} align="center">{tx.nothingSavedSub}</T>
        </View>
      )}
      {v.reminders.length > 0 && (<>
        <Kicker>{tx.remTitle}</Kicker>
        {v.reminders.map((r) => (
          <View key={r.id} style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }]}>
            <Diamond color={th.blue} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T size={14} w={600} lines={1}>{r.name}</T>
              <T mono size={11} color={th.muted}>{r.when} · {tx.alertBefore}</T>
            </View>
            <Pressable onPress={r.remove} style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: th.ink(0.12), justifyContent: 'center' }}>
              <T size={11} w={500} color={th.text2}>{tx.remove}</T>
            </Pressable>
          </View>
        ))}
      </>)}
      {v.savedTopics.length > 0 && (<>
        <Kicker>{tx.topics} · {v.savedTopics.length}</Kicker>
        <Grid cols={2} gap={12}>{v.savedTopics.map((o) => <ObjCard key={o.id} o={o} imgH={100} nameSize={15} />)}</Grid>
      </>)}
      {v.savedArticles.length > 0 && (<>
        <Kicker>{tx.stories} · {v.savedArticles.length}</Kicker>
        {v.savedArticles.map((n) => <NewsRow key={n.id} n={n} size={76} titleSize={14.5} pb={14} />)}
      </>)}
    </View>
  );
}

function Solar({ v }) {
  const th = useT(), tx = v.tx, so = v.solar;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={tx.interactive} title={tx.solarTitle} />
      <ChipRow>{v.solarViews.map((c) => <Chip key={c.key} label={c.label} active={c.active} onPress={c.pick} />)}</ChipRow>

      {so.orbits && (<>
        <View style={{ width: 330, height: 330, alignSelf: 'center' }}>
          <Svg width={330} height={330} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="rgb(240,180,106)" stopOpacity="0.08" />
                <Stop offset="0.6" stopColor="rgb(240,180,106)" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
                <Stop offset="0.35" stopColor="rgb(240,180,106)" stopOpacity="0.7" />
                <Stop offset="1" stopColor="rgb(240,180,106)" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={165} cy={165} r={165} fill="url(#glow)" />
            {so.rings.map((d, i) => <Circle key={i} cx={165} cy={165} r={d / 2} fill="none" stroke={th.ink(0.08)} strokeWidth={1} />)}
            <Circle cx={165} cy={165} r={30} fill="url(#sun)" />
            <Circle cx={165} cy={165} r={11} fill={th.amber} />
          </Svg>
          {so.planets.map((p) => (
            <Pressable key={p.id} onPress={p.pick} hitSlop={8} style={{ position: 'absolute', left: p.x - p.s / 2, top: p.y - p.s / 2, width: p.s, height: p.s, borderRadius: p.s / 2, backgroundColor: p.color }}>
              {p.isSel && (<>
                <View style={{ position: 'absolute', left: -5, top: -5, right: -5, bottom: -5, borderRadius: p.s, borderWidth: 1.5, borderColor: th.text }} />
                <View style={{ position: 'absolute', top: -22, left: -60, right: -60, alignItems: 'center' }}>
                  <T mono w={600} size={11} lines={1}>{p.name}</T>
                </View>
              </>)}
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T mono w={500} size={11} color={th.muted}>{tx.timeTravel}</T>
            <T mono w={500} size={11}>{so.dateLabel}</T>
          </View>
          <Slider minimumValue={-365} maximumValue={365} step={1} value={so.offset} onValueChange={so.onOffset}
            minimumTrackTintColor={th.amber} maximumTrackTintColor={th.ink(0.2)} thumbTintColor={th.amber} style={{ width: '100%', height: 36 }} />
        </View>
        <View style={{ borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06), paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: so.sel.color }} />
            <T size={20} w={700}>{so.sel.name}</T>
          </View>
          <StatGrid cols={3} cells={[{ k: tx.fromSun, v: so.sel.au }, { k: tx.fromEarth, v: so.sel.fromEarth }, { k: tx.yearCap, v: so.sel.year }]} />
          <Btn label={`${tx.readAbout} ${so.sel.name} →`} onPress={so.sel.open} />
        </View>
        <T mono size={11} lh={1.5} color={th.muted2}>{tx.solarNote}</T>
      </>)}

      {so.sizes && (<>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, gap: 14, alignItems: 'flex-end' }}>
          {so.sizeList.map((p) => (
            <Pressable key={p.id} onPress={p.open} style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: p.px, height: p.px, borderRadius: p.px / 2, backgroundColor: p.color }} />
              <T mono w={500} size={11} color={th.text2}>{p.name}</T>
              <T mono size={10} color={th.muted2}>{p.km}</T>
            </Pressable>
          ))}
        </ScrollView>
        <T size={13.5} lh={1.5} color={th.muted}>{tx.sizeNote}</T>
      </>)}
    </View>
  );
}

function Walls({ v }) {
  const th = useT(), tx = v.tx;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={tx.nasaImagery} title={tx.wallsTitle} />
      <ChipRow>{v.wallThemes.map((c) => <Chip key={c.key} label={c.label} active={c.active} onPress={c.pick} />)}</ChipRow>
      <Grid cols={2} gap={10}>
        {v.walls.map((w) => (
          <Pressable key={w.key} onPress={w.open} style={{ aspectRatio: 9 / 16, borderRadius: 14, overflow: 'hidden' }}>
            <Stripes />
            <Img src={w.src} />
          </Pressable>
        ))}
      </Grid>
      {v.wallsLoading && <T mono w={500} size={12} color={th.muted} align="center">{tx.loadingImgs}</T>}
    </View>
  );
}

function Weight({ v }) {
  const th = useT(), tx = v.tx, w = v.weight;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={tx.funCalc} title={tx.weightTitle} />
      <View style={{ borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06), paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <T size={14} color={th.text2} style={{ flex: 1 }}>{tx.yourWeight}</T>
        <TextInput value={w.kg} onChangeText={w.onKg} keyboardType="numeric" maxLength={3}
          style={{ width: 90, height: 44, borderRadius: 12, borderWidth: 1, borderColor: th.ink(0.12), backgroundColor: th.bg, color: th.text, fontFamily: FONTS.sans[600], fontSize: 18, textAlign: 'center' }} />
        <T mono w={500} size={13} color={th.muted}>kg</T>
      </View>
      <View style={{ gap: 12 }}>
        {w.rows.map((r) => (
          <Pressable key={r.name} onPress={r.open} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={14.5} w={500}>{r.name}</T>
              <T mono w={600} size={14}>{r.val}</T>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: th.ink(0.06), overflow: 'hidden' }}>
              <View style={{ height: '100%', width: r.pct + '%', backgroundColor: th.blue }} />
            </View>
          </Pressable>
        ))}
      </View>
      <Btn label={tx.shareWeight} onPress={w.share} />
    </View>
  );
}

function Moon({ v }) {
  const th = useT(), tx = v.tx, m = v.moonNow;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={v.todayLabel} title={tx.moonTitle} />
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
        <MoonDisc size={150} m={m} />
        <T size={22} w={700}>{m.name}</T>
        <T mono w={500} size={12} color={th.muted}>{m.illum} {tx.illuminated} · {m.dayOf}</T>
      </View>
      <StatGrid cols={2} cells={v.moonNext.map((n) => ({ k: n.label, v: n.date }))} />
      <Kicker>{tx.next30}</Kicker>
      <Grid cols={6} gap={6} rowGap={10}>
        {v.moonDays.map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <MoonDisc size={30} m={d} />
            <T mono w={500} size={10} color={th.muted}>{d.label}</T>
          </View>
        ))}
      </Grid>
      <Kicker>{tx.eclipsesTitle}</Kicker>
      {v.eclipses.map((e) => (
        <View key={e.key} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
          <View style={{ width: 54, alignItems: 'center' }}>
            <T mono w={500} size={10} color={th.amber}>{e.mon}</T>
            <T size={22} w={700} lh={1.1}>{e.day}</T>
            <T mono size={10} color={th.muted}>{e.year}</T>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <T size={14.5} w={600}>{e.type}</T>
            <T size={12.5} color={th.muted}>{tx.visibleFrom} {e.where}</T>
          </View>
        </View>
      ))}
      <T mono size={11} color={th.muted2}>{tx.approx}</T>
    </View>
  );
}

function Badges({ v }) {
  const th = useT(), tx = v.tx;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={`${v.rank.xp} XP`} title={tx.achTitle} />
      <View style={{ gap: 8 }}>
        {v.ranks.map((r, i) => (
          <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
            r.reached ? { backgroundColor: 'rgba(240,180,106,.1)' } : { borderWidth: 1, borderColor: th.ink(0.06) }]}>
            {r.reached ? <Diamond size={10} color={th.amber} /> : <Diamond size={10} outline={th.lineStrong} />}
            <T w={r.reached ? 600 : 400} color={r.reached ? th.text : th.muted} style={{ flex: 1 }}>{r.name}</T>
            <T mono w={500} size={11} color={r.reached ? th.amber : th.muted2}>{r.xp} XP</T>
          </View>
        ))}
      </View>
      <Kicker>{tx.badgesCap} · {v.rank.badgeCount}</Kicker>
      <Grid cols={2} gap={10}>
        {v.badges.map((b) => (
          <View key={b.id} style={[{ padding: 14, borderRadius: 16, gap: 6, flex: 1 },
            b.earned ? { backgroundColor: th.surface, borderWidth: 1, borderColor: 'rgba(240,180,106,.4)' } : { borderWidth: 1, borderStyle: 'dashed', borderColor: th.ink(0.12) }]}>
            {b.earned
              ? <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: th.amber, alignItems: 'center', justifyContent: 'center' }}><T size={13} w={700} color={th.onAccent}>✓</T></View>
              : <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: th.lineStrong }} />}
            <T size={14.5} w={b.earned ? 600 : 500} color={b.earned ? th.text : th.muted}>{b.name}</T>
            <T size={12} lh={1.4} color={b.earned ? th.muted : th.muted2}>{b.desc}</T>
          </View>
        ))}
      </Grid>
      <T size={13} lh={1.5} color={th.muted}>{tx.xpNote}</T>
    </View>
  );
}

function Picker({ v, kicker, title, items, note, renderMain, renderSub, bgActive }) {
  const th = useT(), tx = v.tx;
  return (
    <View style={{ gap: 18 }}>
      <BackBtn label={tx.back} onPress={v.back} />
      <Header kicker={kicker} title={title} />
      <View style={{ gap: 8 }}>
        {items.map((l) => (
          <Pressable key={l.id} onPress={l.pick} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1 },
            l.active ? { borderColor: th.amber, backgroundColor: bgActive } : { borderColor: th.ink(0.08), backgroundColor: th.surface }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={16} w={l.active ? 600 : 500}>{renderMain(l)}</T>
              <T size={12} color={th.muted}>{renderSub(l)}</T>
            </View>
            {l.active && <T color={th.amber}>✓</T>}
          </Pressable>
        ))}
      </View>
      {!!note && <T size={13} lh={1.5} color={th.muted}>{note}</T>}
    </View>
  );
}

export default function MoreScreens({ v }) {
  const tx = v.tx;
  if (v.isMoreHome) return <MoreHome v={v} />;
  switch (v.sub) {
    case 'saved': return <Saved v={v} />;
    case 'solar': return <Solar v={v} />;
    case 'walls': return <Walls v={v} />;
    case 'weight': return <Weight v={v} />;
    case 'moon': return <Moon v={v} />;
    case 'badges': return <Badges v={v} />;
    case 'theme': return <Picker v={v} kicker={tx.settings} title={tx.appearance} items={v.themes} renderMain={(l) => l.name} renderSub={(l) => l.sub} bgActive="rgba(240,180,106,.1)" />;
    case 'lang': return <Picker v={v} kicker={tx.settings} title={tx.langTitle} items={v.langs} note={tx.langNote} renderMain={(l) => l.native} renderSub={(l) => l.name} bgActive="rgba(240,180,106,.08)" />;
    default: return null;
  }
}