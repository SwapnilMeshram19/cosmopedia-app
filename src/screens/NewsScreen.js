import React from 'react';
import { View, Pressable } from 'react-native';
import { T, useT, Header, Chip, ChipRow, Stripes, Img, Btn } from '../components/ui';
import { AdSlot } from '../ads';

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

// In-feed banner: a plain AdMob banner between stories, no extra label (the ad itself carries
// Google's ad marker). Spacing keeps it clearly apart from the tappable news rows.
function FeedBanner() {
  return <View style={{ marginVertical: 4 }}><AdSlot kind="horizontal" /></View>;
}

export default function NewsScreen({ v }) {
  const th = useT(), tx = v.tx;
  const pill = { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center' };
  return (
    <View style={{ gap: 16 }}>
      <Header kicker={tx.liveFeed} title={tx.newsTitle} right={
        <Pressable onPress={v.refreshNews} style={[pill, { borderWidth: 1, borderColor: th.ink(0.1) }]}>
          <T mono w={500} size={12} color={th.text2}>↻</T>
        </Pressable>
      } />
      <ChipRow>{v.newsFilters.map((c) => <Chip key={c.key} label={c.label} active={c.active} onPress={c.pick} accent="blue" />)}</ChipRow>

      {v.newsErr && <View style={{ padding: 16, borderRadius: 14, backgroundColor: th.errBg }}><T size={14} color={th.err}>{tx.newsErr}</T></View>}

      {v.newsItems.map((n) => n.isAd
        ? <FeedBanner key={n.key} />
        : <NewsRow key={n.key} n={n} />)}

      {v.newsLoading && <T mono w={500} size={12} color={th.muted} align="center" style={{ padding: 14 }}>{tx.loadingNews}</T>}
      {v.canLoadMore && <Btn label={tx.loadMore} onPress={v.loadMore} height={46} size={14} />}
      <T mono size={10.5} color={th.muted2} align="center">{tx.newsSource}</T>
    </View>
  );
}