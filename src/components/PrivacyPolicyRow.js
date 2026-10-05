import React, { useCallback } from 'react';
import { Alert, Linking, Pressable, Text } from 'react-native';
import { PRIVACY_POLICY_URL } from '../legal';

export default function PrivacyPolicyRow({ label = 'Privacy Policy', style, textStyle }) {
  const open = useCallback(async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch (e) {
      Alert.alert(label, PRIVACY_POLICY_URL);
    }
  }, [label]);

  return (
    <Pressable
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={style}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}