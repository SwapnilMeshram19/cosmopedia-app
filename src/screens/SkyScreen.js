import React from 'react';
import { View, Pressable } from 'react-native';
import { T, useT, Header, StatGrid, Kicker, Btn, Diamond, Toggle } from '../components/ui';
import IssMap from '../components/IssMap';

export default function SkyScreen({ v }) {
  const th = useT(), tx = v.tx, sky = v.sky, iss = v.iss;
  const card = { borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) };
  return (
    <View style={{ gap: 18 }}>
      <Header kicker={v.todayLabel} title={tx.skyTitle} />

      <View style={[card, { paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Diamond color={th.blue} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T size={14} w={600}>{sky.place}</T>
          <T mono size={11} color={th.muted}>{sky.coords}</T>
        </View>
        <Btn label={tx.useLoc} onPress={sky.locate} variant="outlineBlue" height={32} size={12} radius={16} style={{ paddingHorizontal: 12 }} />
      </View>

      {sky.noDark && <View style={[card, { padding: 16 }]}><T size={14} lh={1.5} color={th.text2}>{tx.noDark}</T></View>}

      {sky.hasDark && (<>
        <StatGrid cols={3} cells={[{ k: tx.darkFrom, v: sky.darkStart }, { k: tx.until, v: sky.darkEnd }, { k: tx.moonCap, v: sky.moonIllum }]} />
        <Kicker>{tx.visTonight}</Kicker>
        {sky.planets.map((p) => (
          <Pressable key={p.id} onPress={p.open} style={[card, { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14 }]}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: p.color }} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <T size={15} w={600}>{p.name}</T>
              <T mono size={11} color={th.muted}>{p.when} · {tx.look} {p.dir} · {tx.upTo} {p.alt}°</T>
            </View>
            <T mono w={500} size={10} color={th.blue} align="right">{p.eye}</T>
          </Pressable>
        ))}
        {sky.none && <T size={14} color={th.muted}>{tx.noPlanets}</T>}
        <Btn label={tx.shareSky} onPress={sky.share} />
      </>)}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Kicker>{tx.issLive}</Kicker>
        <T mono w={500} size={10} color={th.green}>{tx.live}</T>
      </View>
      <IssMap lat={sky.lat} lon={sky.lon} bg={th.surface2} />
      <StatGrid cols={2} cells={[{ k: tx.position, v: iss.pos }, { k: tx.altitude, v: iss.alt }, { k: tx.speed, v: iss.speed }, { k: tx.fromYou, v: iss.dist }]} />
      <T size={13} color={th.muted}>{iss.status}</T>

      <View style={[card, { paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={14} w={600}>{tx.issAlerts}</T>
          <T size={12.5} color={th.muted}>{tx.issAlertsSub}</T>
        </View>
        <Toggle on={v.issAlertsOn} onPress={v.toggleIssAlerts} />
      </View>
    </View>
  );
}
