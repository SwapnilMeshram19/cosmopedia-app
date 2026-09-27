import React from 'react';
import { View } from 'react-native';
import { issHtml } from './issHtml';

export default function IssMap({ lat, lon, bg }) {
  return (
    <View style={{ height: 190, borderRadius: 16, overflow: 'hidden', backgroundColor: bg }}>
      <iframe title="ISS live map" srcDoc={issHtml(lat, lon)} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
    </View>
  );
}
