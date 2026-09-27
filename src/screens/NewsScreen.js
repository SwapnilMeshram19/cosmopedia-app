import React from 'react';
import { View, Pressable } from 'react-native';
import { T, useT, Header, Chip, ChipRow, Stripes, Img, Btn } from '../components/ui';
import { AdSlot, adsAvailable } from '../ads';

export function NewsRow({ n, size = 96, titleSize = 15, gap = 14, pb = 16 }) {
  const th = useT();
  return (
    <Pressable onPress={n.open} style={{ flexDirection: 'row', gap, paddingBottom: pb, borderBottomWidth: 1, borderBottomColor: th.ink(0.06) }}>
      <View style={{ width: size, height: size, borderRadius: size > 80 ? 14 : 12, overflow: 'hidden' }}>
        <Stripes />
        {n.hasImg && <Img src={n.img} />}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <T mono w={500} size={10} ls={0.06} color={th.blue} lines={1}>{n.site} · {n.ago}</T>
        <T size={titleSize} w={600} lh={1.3} lines={3}>{n.title}</T>
      </View>
    </Pressable>
  );
}

function NativeAdCard({ tx }) {
  const th = useT();
  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: th.ink(0.18), padding: 14, backgroundColor: th.surface2, gap: 8 }}>
      <T mono w={500} size={9.5} ls={0.12} color={th.amber}>{tx.sponsored}</T>
      <AdSlot kind="native" />
    </View>
  );
}

function PlaceholderAd({ tx }) {
  const th = useT();
  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: th.ink(0.18), padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: th.surface2 }}>
      <View style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden' }}><Stripes step={6} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <T mono w={500} size={9.5} ls={0.12} color={th.amber}>{tx.sponsored}</T>
        <T size={14} color={th.text2}>{tx.nativeAd}</T>
      </View>
    </View>
  );
}

export default function NewsScreen({ v }) {
  const th = useT(), tx = v.tx;
  const pill = { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center' };
  return (
    <View style={{ gap: 16 }}>
      <Header kicker={tx.liveFeed} title={tx.newsTitle} right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={v.toggleAlerts} style={[pill, v.alertsOn ? { backgroundColor: th.blue } : { borderWidth: 1, borderColor: 'rgba(143,184,255,.5)' }]}>
            <T mono w={v.alertsOn ? 600 : 500} size={12} color={v.alertsOn ? th.onBlue : th.blue}>{v.alertsOn ? tx.alertsOn : tx.alertsOff}</T>
          </Pressable>
          <Pressable onPress={v.refreshNews} style={[pill, { borderWidth: 1, borderColor: th.ink(0.1) }]}>
            <T mono w={500} size={12} color={th.text2}>↻</T>
          </Pressable>
        </View>
      } />
      <ChipRow>{v.newsFilters.map((c) => <Chip key={c.key} label={c.label} active={c.active} onPress={c.pick} accent="blue" />)}</ChipRow>

      {v.newsErr && <View style={{ padding: 16, borderRadius: 14, backgroundColor: th.errBg }}><T size={14} color={th.err}>{tx.newsErr}</T></View>}

      {v.newsItems.map((n) => n.isAd
        ? (adsAvailable() ? <NativeAdCard key={n.key} tx={tx} /> : <PlaceholderAd key={n.key} tx={tx} />)
        : <NewsRow key={n.key} n={n} />)}

      {v.newsLoading && <T mono w={500} size={12} color={th.muted} align="center" style={{ padding: 14 }}>{tx.loadingNews}</T>}
      {v.canLoadMore && <Btn label={tx.loadMore} onPress={v.loadMore} height={46} size={14} />}
      <T mono size={10.5} color={th.muted2} align="center">{tx.newsSource}</T>
    </View>
  );
}
