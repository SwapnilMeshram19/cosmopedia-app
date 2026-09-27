import React, { useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { issHtml } from './issHtml';

export default function IssMap({ lat, lon, bg }) {
  const source = useMemo(() => ({ html: issHtml(lat, lon), baseUrl: 'https://cosmopedia.app/' }), [lat, lon]);
  return (
    <View style={{ height: 190, borderRadius: 16, overflow: 'hidden', backgroundColor: bg }}>
      <WebView
        source={source}
        originWhitelist={['*']}
        scrollEnabled={false}
        javaScriptEnabled
        style={{ backgroundColor: '#0b0d12' }}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
