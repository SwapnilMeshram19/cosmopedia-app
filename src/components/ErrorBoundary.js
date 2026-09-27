import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

// Release builds close silently on a render error. This shows the error on screen instead,
// with a button to go back, so a screenshot is enough to find the bug.
export default class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { this.info = info && info.componentStack; }
  reset = () => { this.setState({ error: null }); this.props.onReset && this.props.onReset(); };
  render() {
    const e = this.state.error;
    if (!e) return this.props.children;
    return (
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#07080c', paddingTop: 60, paddingHorizontal: 20, zIndex: 999 }}>
        <Text style={{ color: '#ff9b9b', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>Something went wrong</Text>
        <ScrollView style={{ flex: 1 }}>
          <Text style={{ color: '#eceef3', fontSize: 13, marginBottom: 10 }}>{String(e && e.message || e)}</Text>
          <Text style={{ color: '#8a90a0', fontSize: 10.5 }}>{String(this.info || e.stack || '').slice(0, 1800)}</Text>
        </ScrollView>
        <Pressable onPress={this.reset} style={{ height: 48, borderRadius: 14, backgroundColor: '#f0b46a', alignItems: 'center', justifyContent: 'center', marginVertical: 30 }}>
          <Text style={{ color: '#1a1206', fontSize: 15, fontWeight: '600' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }
}
