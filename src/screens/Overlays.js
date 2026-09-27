import React, { useState, useRef } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Modal, ActivityIndicator, useWindowDimensions, FlatList } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ZoomableImage from '../components/ZoomableImage';
import { shareImage } from '../imageSave';
import { useRewardedSave } from '../rewardedSave';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { T, useT, Stripes, Img, Kicker, Grid, Diamond, Btn } from '../components/ui';
import { AdSlot, BottomBanner, bannerEnabled } from '../ads';
import { httpsify } from '../constants';

const fill = StyleSheet.absoluteFillObject;

function TopButtons({ top, onBack, saved, onSave, tx }) {
  const th = useT();
  return (<>
    <Pressable onPress={onBack} style={{ position: 'absolute', top, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center' }}>
      <T size={18} color="#fff">←</T>
    </Pressable>
    {onSave && (
      <Pressable onPress={onSave} style={{ position: 'absolute', top, right: 16, height: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center', backgroundColor: saved ? th.amber : 'rgba(0,0,0,.55)' }}>
        <T size={13} w={saved ? 600 : 500} color={saved ? th.onAccent : '#fff'}>{saved ? tx.saved : tx.save}</T>
      </Pressable>
    )}
  </>);
}

function Detail({ v, insets }) {
  const th = useT(), tx = v.tx, d = v.detail;
  return (
    <View style={[fill, { backgroundColor: th.bg, zIndex: 10 }]}>
      <ScrollView ref={v.detailRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bannerEnabled() ? 24 : 40 + insets.bottom }}>
        <View style={{ height: 360 + insets.top }}>
          <Stripes />
          {!!d.hero && <Pressable onPress={d.openHero} style={fill}><Img src={d.hero} /></Pressable>}
          <LinearGradient pointerEvents="none" colors={[th.bgA(0.5), th.bgA(0), th.bgA(0), th.bg]} locations={[0, 0.3, 0.55, 1]} style={fill} />
          <TopButtons top={insets.top + 8} onBack={v.closeDetail} saved={d.saved} onSave={d.toggleSave} tx={tx} />
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 6, gap: 4 }}>
            <T mono w={500} size={10.5} ls={0.14} upper color={th.amber}>{d.catLabel}</T>
            <T size={36} w={700} ls={-0.02} lh={1.05}>{d.name}</T>
            <T size={14} color={th.text2}>{d.tagline}</T>
          </View>
        </View>
        <View style={{ paddingTop: 18, paddingHorizontal: 20, gap: 22 }}>
          <Grid cols={2} gap={1} lineColor={th.ink(0.07)} radius={16}>
            {d.facts.map((f, i) => (
              <View key={i} style={{ backgroundColor: th.cell, paddingVertical: 12, paddingHorizontal: 14, gap: 3, flex: 1 }}>
                <T mono w={500} size={9.5} ls={0.12} upper color={th.muted}>{f.k}</T>
                <T size={16} w={600}>{f.v}</T>
              </View>
            ))}
          </Grid>
          {v.showAds && <AdSlot kind="rectangle" />}
          {d.sections.map((sec, si) => (
            <View key={sec.num} style={{ gap: 8 }}>
              {si === 2 && v.showAds && <View style={{ marginBottom: 14 }}><AdSlot kind="horizontal" /></View>}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <T mono w={500} size={10.5} color={th.amber}>{sec.num}</T>
                <T size={18} w={600} style={{ flex: 1 }}>{sec.h}</T>
              </View>
              <T size={15.5} lh={1.6} color={th.text2}>{sec.p}</T>
            </View>
          ))}
          {d.hasDyk && (
            <View style={{ borderRadius: 18, backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06), paddingVertical: 16, paddingHorizontal: 18, gap: 12 }}>
              <Kicker color={th.blue}>{tx.dyk}</Kicker>
              {d.dyk.map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View style={{ marginTop: 8 }}><Diamond size={6} color={th.blue} /></View>
                  <T size={14.5} lh={1.5} color={th.text2} style={{ flex: 1 }}>{t}</T>
                </View>
              ))}
              <Btn label={tx.shareFact} onPress={d.share} variant="outlineBlue" height={34} radius={17} size={12.5} style={{ alignSelf: 'flex-start' }} />
            </View>
          )}
          {d.gallery.length > 0 && (
            <View style={{ gap: 10 }}>
              <Kicker>{tx.gallery}</Kicker>
              <Grid cols={3} gap={6}>
                {d.gallery.map((g, i) => (
                  <Pressable key={i} testID="gallery-image" onPress={g.open} style={{ aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: th.surface }}>
                    <Img src={g.src} />
                  </Pressable>
                ))}
              </Grid>
            </View>
          )}
          {d.related.length > 0 && (
            <View style={{ gap: 10 }}>
              <Kicker>{tx.moreIn} {d.catLabel}</Kicker>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                {d.related.map((r) => (
                  <Pressable key={r.id} onPress={r.open} style={{ width: 130, borderRadius: 14, overflow: 'hidden', backgroundColor: th.surface, borderWidth: 1, borderColor: th.ink(0.06) }}>
                    <View style={{ height: 84 }}><Stripes />{r.hasImg && <Img src={r.img} />}</View>
                    <View style={{ paddingVertical: 8, paddingHorizontal: 10 }}><T size={13} w={600} lines={1}>{r.name}</T></View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
      {v.showAds && <BottomBanner padBottom={insets.bottom} bg={th.bg} line={th.ink(0.07)} />}
    </View>
  );
}

function Article({ v, insets }) {
  const th = useT(), tx = v.tx, a = v.article;
  return (
    <View style={[fill, { backgroundColor: th.bg, zIndex: 11 }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bannerEnabled() ? 24 : 40 + insets.bottom }}>
        <View style={{ height: 280 + insets.top }}>
          <Stripes />
          {!!a.img && <Img src={a.img} />}
          <TopButtons top={insets.top + 8} onBack={v.closeArticle} saved={a.saved} onSave={a.toggleSave} tx={tx} />
        </View>
        <View style={{ padding: 20, gap: 14 }}>
          <T mono w={500} size={11} color={th.blue}>{a.site} · {a.date}</T>
          <T size={24} w={700} lh={1.2} ls={-0.01}>{a.title}</T>
          <T size={15.5} lh={1.6} color={th.text2}>{a.summary}</T>
          <Btn label={`${tx.readFull} ↗`} onPress={a.openFull} variant="blue" height={50} size={15} style={{ marginTop: 8 }} />
          {v.showAds && <View style={{ marginTop: 10 }}><AdSlot kind="rectangle" /></View>}
        </View>
      </ScrollView>
      {v.showAds && <BottomBanner padBottom={insets.bottom} bg={th.bg} line={th.ink(0.07)} />}
    </View>
  );
}

// Wallpaper preview: shows the sharper ~large / ~medium file, falling back to the thumbnail.
// (The full ~orig file is far too big to display; it is only used for saving.)
function WallImage({ src }) {
  const candidates = sizeVariants(src);
  const [i, setI] = useState(0);
  return (
    <Image
      key={candidates[i]}
      source={{ uri: candidates[i] }}
      placeholder={{ uri: httpsify(src) }}
      style={fill}
      contentFit="cover"
      transition={200}
      onError={() => { if (i + 1 < candidates.length) setI(i + 1); }}
    />
  );
}

function Wall({ v, insets }) {
  const tx = v.tx, w = v.wall;
  const hasBanner = v.showAds && bannerEnabled();
  const failed = w.msg === tx.tDlFail;
  return (
    <View style={[fill, { backgroundColor: '#000', zIndex: 12 }]}>
     <View style={{ flex: 1 }}>
      <Pressable onPress={w.view} style={fill}><WallImage src={w.src} /></Pressable>
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.92)']} locations={[0, 0.22, 0.55, 1]} style={fill} />
      <TopButtons top={insets.top + 8} onBack={v.closeWall} tx={tx} />
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: hasBanner ? 16 : 28 + insets.bottom, gap: 12 }}>
        <T size={16} w={600} lh={1.3} color="#fff">{w.title}</T>
        <T mono size={10.5} color="#b8bcc6">Tap the image to view full screen and zoom</T>
        {/* One tap: ad → HD download → saved. Disabled until the whole thing finishes. */}
        <Btn label={w.dlLabel} onPress={w.download} disabled={w.busy} variant="amber" height={50} size={15} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn label="Share" onPress={w.share} disabled={w.busy} variant="blue" height={44} style={{ flex: 1 }} />
          <Btn label="Open in browser" onPress={w.openHd} variant="ghost" height={44} style={{ flex: 1, borderColor: 'rgba(255,255,255,.3)' }} textStyle={{ color: '#fff' }} />
        </View>
        {!!w.msg && <T size={13} w={500} color={failed ? '#ff9b9b' : '#7fd6a0'}>{w.msg}</T>}
        <T mono size={10} color="#b8bcc6">{tx.credit}</T>
      </View>
     </View>
      {v.showAds && <BottomBanner padBottom={insets.bottom} bg="#000" />}
    </View>
  );
}

// NASA image search returns small "~thumb" files. Try the large/medium versions first,
// show the thumbnail while they load, and fall back step by step if one is missing.
const sizeVariants = (u) => {
  u = httpsify(u || '');
  const m = u.match(/^(.*)~(thumb|small|medium|large|orig)\.(jpe?g|png)$/i);
  return m ? [`${m[1]}~large.${m[3]}`, `${m[1]}~medium.${m[3]}`, u] : [u];
};

function LightboxPage({ item, width, height, zoomed, onZoomChange, onSingleTap, onSwipeDown, onReady }) {
  const candidates = [...new Set([...sizeVariants(item.src), ...(item.fallback ? [httpsify(item.fallback)] : [])])];
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {!failed && (
        <ZoomableImage
          key={candidates[i]}
          uri={candidates[i]}
          placeholder={httpsify(item.src)}
          width={width}
          height={height}
          zoomed={zoomed}
          onZoomChange={onZoomChange}
          onSingleTap={onSingleTap}
          onSwipeDown={onSwipeDown}
          onLoad={() => { setLoading(false); onReady(candidates[i]); }}
          onError={() => { if (i + 1 < candidates.length) setI(i + 1); else { setLoading(false); setFailed(true); } }}
        />
      )}
      {loading && <ActivityIndicator size="large" color="#f0b46a" style={{ position: 'absolute' }} pointerEvents="none" />}
      {failed && <T mono size={11} color="#8a90a0">IMAGE UNAVAILABLE</T>}
    </View>
  );
}

function IconBtn({ label, onPress, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={{ minWidth: 40, height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}>
      <T size={14} w={500} color="#fff">{label}</T>
    </Pressable>
  );
}

// Full-screen image viewer: swipe between images, pinch/double-tap zoom, pan, swipe down to
// close, tap to hide controls, save to phone, share.
function Lightbox({ v, insets }) {
  const lb = v.lightbox;
  const items = lb.items || [lb];
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(Math.min(lb.index || 0, items.length - 1));
  const [zoomed, setZoomed] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);
  const loaded = useRef({});
  const noteT = useRef(null);
  const cur = items[index] || items[0];
  const bestUrl = () => loaded.current[index] || sizeVariants(cur.src)[0];

  const flash = (m) => { clearTimeout(noteT.current); setNote(m); noteT.current = setTimeout(() => setNote(null), 2400); };
  // One tap: rewarded ad → HD download → saved. The shared lock ignores every extra tap
  // (here or on any other Save button) until the ad AND the save have finished.
  const { saving, save } = useRewardedSave();
  const onSave = async () => {
    if (saving || busy) return;
    const res = await save(bestUrl(), { skipAd: !(v.showAds && bannerEnabled()) });
    if (res === 'gallery') flash('Saved to your gallery ✓');
    if (res === 'error') flash('Couldn’t save this image');
  };
  const onShare = async () => {
    if (saving || busy) return;
    setBusy('share');
    try { await shareImage(bestUrl()); } catch (e) { flash('Couldn’t share this image'); }
    setBusy(null);
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={v.closeLightbox}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <FlatList
          data={items}
          keyExtractor={(it, i) => it.src + i}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed && items.length > 1}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => { const n = Math.round(e.nativeEvent.contentOffset.x / width); if (n !== index) { setIndex(n); setZoomed(false); } }}
          windowSize={3}
          initialNumToRender={1}
          renderItem={({ item, index: i }) => (
            <LightboxPage
              item={item}
              width={width}
              height={height}
              zoomed={i === index && zoomed}
              onZoomChange={setZoomed}
              onSingleTap={() => setChrome((c) => !c)}
              onSwipeDown={v.closeLightbox}
              onReady={(u) => { loaded.current[i] = u; }}
            />
          )}
        />

        {chrome && (
          <View style={{ position: 'absolute', top: insets.top + 10, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconBtn label="✕" onPress={v.closeLightbox} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              {items.length > 1 && <T mono w={500} size={12} color="#d4d7de">{index + 1} / {items.length}</T>}
            </View>
            <IconBtn label={busy === 'share' ? '…' : 'Share'} onPress={onShare} disabled={!!busy || saving} />
            <IconBtn label={saving ? 'Saving HD…' : (v.showAds && bannerEnabled() ? '▶ Save HD' : '⤓ Save HD')} onPress={onSave} disabled={!!busy || saving} />
          </View>
        )}

        {chrome && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 30, paddingBottom: insets.bottom + 18, paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,.45)', gap: 6 }}>
            {!!cur.title && <T size={13.5} lh={1.4} color="#e6e8ee" align="center" lines={3}>{cur.title}</T>}
            <T mono size={10} color="#8a90a0" align="center">{zoomed ? 'Double-tap to reset' : 'Pinch or double-tap to zoom · swipe down to close'}</T>
          </View>
        )}

        {!!note && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 110, alignItems: 'center' }}>
            <View style={{ paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#eceef3' }}>
              <T size={14} w={500} color="#07080c">{note}</T>
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function Interstitial({ v, insets }) {
  const th = useT();
  return (
    <View style={[fill, { backgroundColor: th.bg, zIndex: 30, paddingTop: 48 + insets.top, paddingHorizontal: 20, paddingBottom: 28 + insets.bottom, gap: 16 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T mono w={500} size={10.5} ls={0.14} color={th.amber}>{v.interLabel}</T>
        {v.interDone
          ? <Pressable onPress={v.closeInter} style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: th.text, justifyContent: 'center' }}><T size={13} w={600} color={th.bg}>{v.interCloseLabel}</T></Pressable>
          : <T mono w={500} size={12} color={th.muted}>{v.interCloseIn}</T>}
      </View>
      <View style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: th.ink(0.18), overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <Stripes a={th.stripe1} b={th.cell} step={10} />
        <T mono w={500} size={12} color={th.muted} align="center" style={{ paddingHorizontal: 20 }}>{v.interText}</T>
      </View>
    </View>
  );
}

export default function Overlays({ v, insets }) {
  const th = useT();
  return (<>
    {!!v.detail && <Detail v={v} insets={insets} />}
    {!!v.article && <Article v={v} insets={insets} />}
    {!!v.wall && <Wall v={v} insets={insets} />}
    {!!v.lightbox && <Lightbox v={v} insets={insets} />}
    {v.interActive && <Interstitial v={v} insets={insets} />}
    {!!v.toast && (
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 150 + insets.bottom, zIndex: 40, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, backgroundColor: th.text, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 12 }}>
        <T size={14} w={500} color={th.bg}>{v.toast}</T>
      </View>
    )}
    {!!v.push && (
      <Pressable onPress={v.pushTap} style={{ position: 'absolute', top: insets.top + 8, left: 10, right: 10, zIndex: 50, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, backgroundColor: th.surface, flexDirection: 'row', gap: 12, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 16 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: th.amber, alignItems: 'center', justifyContent: 'center' }}>
          <T size={17} w={700} color={th.onAccent}>C</T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T mono size={11} color={th.muted}>Cosmopedia · now</T>
          <T size={14.5} w={600}>{v.push.title}</T>
          <T size={13} lh={1.4} color={th.text3}>{v.push.body}</T>
        </View>
      </Pressable>
    )}
  </>);
}