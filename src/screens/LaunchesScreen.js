import React from 'react';
import { View, Pressable } from 'react-native';
import { T, useT, Header, Stripes, Img, Btn } from '../components/ui';
import { AdSlot } from '../ads';

// One launch row: tap for details, "Remind" for a notification 1 hour before liftoff.
function LaunchRow({ l, tx }) {
  const th = useT();
  return (
    <Pressable onPress={l.open} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
      <View style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden' }}>
        <Stripes step={6} />
        {!!l.img && <Img src={l.img} />}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <T size={14} w={600} lines={2} lh={1.3}>{l.name}</T>
        <T mono size={11} color={th.muted} lines={1}>{l.provider}{l.pad ? ' · ' + l.pad : ''}</T>
        {l.isro && (
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(240,180,106,.16)' }}>
            <T mono w={600} size={9.5} color={th.amber}>ISRO</T>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <T mono w={600} size={12} color={th.blue}>{l.when}</T>
        <T mono size={10.5} color={th.muted}>{l.time}</T>
        <T mono size={10} color={th.muted}>{l.status}</T>
        <Pressable onPress={l.remind} hitSlop={6} style={[{ marginTop: 4, height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: 'center' },
          l.reminded ? { backgroundColor: th.blue } : { borderWidth: 1, borderColor: 'rgba(143,184,255,.5)' }]}>
          <T size={11} w={l.reminded ? 600 : 500} color={l.reminded ? th.onBlue : th.blue}>{l.reminded ? tx.reminded : tx.remind}</T>
        </Pressable>
      </View>
    </Pressable>
  );
}

// Launches tab: worldwide upcoming launches merged with ISRO's, sorted by date.
export default function LaunchesScreen({ v }) {
  const th = useT(), tx = v.tx;
  const pill = { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center' };
  return (
    <View style={{ gap: 12 }}>
      <Header kicker={tx.launchesKicker} title={tx.launchesTitle} right={
        <Pressable onPress={v.reloadLaunches} style={[pill, { borderWidth: 1, borderColor: th.ink(0.1) }]}>
          <T mono w={500} size={12} color={th.text2}>↻</T>
        </Pressable>
      } />

      {v.launchLoading && <T mono w={500} size={12} color={th.muted} align="center" style={{ padding: 14 }}>{tx.loadingLaunches}</T>}
      {v.launchErr && (
        <View style={{ padding: 16, borderRadius: 14, backgroundColor: th.errBg, gap: 10 }}>
          <T size={14} color={th.err}>{tx.launchErr}</T>
          <Btn label={tx.retry} onPress={v.reloadLaunches} height={38} size={13} variant="outlineBlue" />
        </View>
      )}
      {v.launchEmpty && <T size={14} color={th.muted}>{tx.noLaunches}</T>}

      {v.launches.map((l, i) => (
        <React.Fragment key={l.id}>
          <LaunchRow l={l} tx={tx} />
          {/* One inline banner after the 4th launch, spaced away from the Remind buttons. */}
          {i === 3 && v.showAds && <View style={{ marginVertical: 6 }}><AdSlot kind="horizontal" /></View>}
        </React.Fragment>
      ))}

      {v.launches.length > 0 && <T mono size={10.5} color={th.muted2} align="center">{tx.launchesSource}</T>}
    </View>
  );
}