import React from 'react';
import { View, Pressable } from 'react-native';
import { T, useT, Header, Stripes, Img, Kicker, MoonDisc, Chip, ChipRow } from '../components/ui';

export default function TodayScreen({ v }) {
  const th = useT(), tx = v.tx, apod = v.apod;
  return (
    <View style={{ gap: 18 }}>
      <Header kicker={v.todayLabel} title={tx.todayTitle} />

      {/* Astronomy Picture of the Day */}
      <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
        <View style={{ height: 300 }}>
          <Stripes />
          {apod.hasImg && <Pressable onPress={apod.open} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}><Img src={apod.img} /></Pressable>}
          {apod.isVideo && (
            <Pressable onPress={apod.openVideo} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <T mono w={500} size={13} color={th.amber}>{tx.watchVideo}</T>
            </Pressable>
          )}
        </View>
        {/* Tap the text for the full details page; tap the picture for the zoomable viewer. */}
        <Pressable onPress={apod.details} disabled={!apod.details} style={{ paddingTop: 16, paddingHorizontal: 18, paddingBottom: 18, gap: 8 }}>
          <T mono w={500} size={10} ls={0.12} color={th.amber}>{tx.apodLabel}</T>
          <T size={20} w={600} lh={1.2}>{apod.title}</T>
          {!!apod.text && <T size={14} lh={1.55} color={th.text3} lines={apod.details ? 4 : undefined}>{apod.text}</T>}
          {!!apod.details && <T mono w={500} size={11} color={th.amber}>Read more →</T>}
        </Pressable>
      </View>

      {/* Moon tonight */}
      <Pressable onPress={v.openMoon} style={{ borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06), paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <MoonDisc size={56} m={v.moonNow} />
        <View style={{ flex: 1, gap: 3 }}>
          <T mono w={500} size={10} ls={0.12} color={th.amber}>{tx.moonTonight}</T>
          <T size={17} w={600}>{v.moonNow.name}</T>
          <T mono size={11} color={th.muted}>{v.moonNow.illum} {tx.lit} · {tx.fullMoon} {v.moonNow.nextFull}</T>
        </View>
        <T color={th.muted}>→</T>
      </Pressable>

      {/* On this day */}
      <View style={{ gap: 12 }}>
        <Kicker>{tx.otdTitle}</Kicker>
        {v.otdLoading && <T size={14} color={th.muted}>{tx.loadingHistory}</T>}
        {v.otd.map((e, i) => (
          <Pressable key={i} onPress={e.open} style={{ flexDirection: 'row', gap: 14, padding: 12, borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
            <View style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden' }}>
              <Stripes />
              {!!e.img && <Img src={e.img} />}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <T mono w={500} size={11} color={th.amber}>{e.year} · {e.ago}</T>
              <T size={14} lh={1.45} color={th.text2}>{e.text}</T>
            </View>
          </Pressable>
        ))}
        {v.otdFallback && <T mono size={11} color={th.muted2}>{tx.otdFallback}</T>}
      </View>

      {/* Upcoming launches */}
      <View style={{ gap: 10 }}>
        <Kicker>{tx.launchesTitle}</Kicker>
        <ChipRow>{v.launchFilters.map((c) => <Chip key={c.key} label={c.label} active={c.active} onPress={c.pick} accent="blue" />)}</ChipRow>
        {v.launchErr && <T size={14} color={th.muted}>{tx.launchErr}</T>}
        {v.isroLaunchLoading && <T size={14} color={th.muted}>{tx.loadingLaunches}</T>}
        {v.isroLaunchErr && <T size={14} color={th.muted}>{tx.isroLaunchErr}</T>}
        {v.isroLaunchEmpty && <T size={14} color={th.muted}>{tx.isroNoLaunch}</T>}
        {v.launches.map((l) => (
          <Pressable key={l.id} onPress={l.open} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
            <View style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden' }}>
              <Stripes step={6} />
              {!!l.img && <Img src={l.img} />}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <T size={14} w={600} lines={1}>{l.name}</T>
              <T mono size={11} color={th.muted} lines={1}>{l.provider} · {l.pad}</T>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <T mono w={500} size={12} color={th.blue}>{l.when}</T>
              <T mono size={10} color={th.muted}>{l.status}</T>
              <Pressable onPress={l.remind} style={[{ marginTop: 4, height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: 'center' },
                l.reminded ? { backgroundColor: th.blue } : { borderWidth: 1, borderColor: 'rgba(143,184,255,.5)' }]}>
                <T size={11} w={l.reminded ? 600 : 500} color={l.reminded ? th.onBlue : th.blue}>{l.reminded ? tx.reminded : tx.remind}</T>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}