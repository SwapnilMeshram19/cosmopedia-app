import React from 'react';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const MAX = 5;
const DOUBLE_TAP_SCALE = 2.5;

// Pinch to zoom (around your fingers), drag to pan while zoomed, double-tap to zoom in/out,
// single tap to show/hide controls, swipe down to close when not zoomed.
export default function ZoomableImage({ uri, placeholder, width, height, zoomed, onZoomChange, onSingleTap, onSwipeDown, onLoad, onError }) {
  const scale = useSharedValue(1), savedScale = useSharedValue(1);
  const tx = useSharedValue(0), ty = useSharedValue(0), savedTx = useSharedValue(0), savedTy = useSharedValue(0);
  const fx = useSharedValue(0), fy = useSharedValue(0);

  const clamp = (v, min, max) => { 'worklet'; return Math.min(Math.max(v, min), max); };
  const limits = (s) => { 'worklet'; return { x: Math.max(0, (width * s - width) / 2), y: Math.max(0, (height * s - height) / 2) }; };
  const settle = () => {
    'worklet';
    const s = clamp(scale.value, 1, MAX);
    const b = limits(s);
    scale.value = withTiming(s);
    tx.value = withTiming(s === 1 ? 0 : clamp(tx.value, -b.x, b.x));
    ty.value = withTiming(s === 1 ? 0 : clamp(ty.value, -b.y, b.y));
    runOnJS(onZoomChange)(s > 1.01);
  };

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      savedScale.value = scale.value; savedTx.value = tx.value; savedTy.value = ty.value;
      fx.value = e.focalX - width / 2; fy.value = e.focalY - height / 2;
    })
    .onUpdate((e) => {
      const s = clamp(savedScale.value * e.scale, 0.7, MAX + 1);
      const k = s / savedScale.value;
      scale.value = s;
      tx.value = fx.value - k * (fx.value - savedTx.value);
      ty.value = fy.value - k * (fy.value - savedTy.value);
    })
    .onEnd(settle);

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => { savedTx.value = tx.value; savedTy.value = ty.value; })
    .onUpdate((e) => {
      if (scale.value > 1.01) { tx.value = savedTx.value + e.translationX; ty.value = savedTy.value + e.translationY; }
      else if (e.translationY > 0) { ty.value = e.translationY; }
    })
    .onEnd((e) => {
      if (scale.value > 1.01) {
        const b = limits(scale.value);
        tx.value = withTiming(clamp(tx.value + e.velocityX * 0.08, -b.x, b.x));
        ty.value = withTiming(clamp(ty.value + e.velocityY * 0.08, -b.y, b.y));
      } else if (ty.value > 120 || e.velocityY > 1200) {
        runOnJS(onSwipeDown)();
      } else {
        ty.value = withTiming(0);
      }
    });
  // When not zoomed, only vertical drags (swipe-down-to-close) are handled here,
  // so horizontal swipes go to the gallery pager.
  if (!zoomed) pan.activeOffsetY([-12, 12]).failOffsetX([-12, 12]);

  const doubleTap = Gesture.Tap().numberOfTaps(2).maxDelay(250).onEnd((e) => {
    if (scale.value > 1.01) {
      scale.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0);
      runOnJS(onZoomChange)(false);
    } else {
      const s = DOUBLE_TAP_SCALE, b = limits(s);
      const px = e.x - width / 2, py = e.y - height / 2;
      scale.value = withTiming(s);
      tx.value = withTiming(clamp(-px * (s - 1), -b.x, b.x));
      ty.value = withTiming(clamp(-py * (s - 1), -b.y, b.y));
      runOnJS(onZoomChange)(true);
    }
  });
  const singleTap = Gesture.Tap().maxDuration(250).onEnd(() => { runOnJS(onSingleTap)(); });

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, style]} collapsable={false}>
        <Image
          source={{ uri }}
          placeholder={placeholder ? { uri: placeholder } : undefined}
          placeholderContentFit="contain"
          style={{ width, height }}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          onLoad={onLoad}
          onError={onError}
        />
      </Animated.View>
    </GestureDetector>
  );
}
