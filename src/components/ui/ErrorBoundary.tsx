import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    try {
      // Dynamic require avoids static module-augmentation side-effects from @sentry/react-native;
      // is a no-op when Sentry was never initialized.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { captureException } = require('@sentry/react-native') as { captureException: (e: unknown, ctx?: unknown) => void };
      captureException(error, { extra: { componentStack: info.componentStack } });
    } catch {}
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>💥</Text>
        <Text style={styles.title}>Algo deu errado</Text>
        <Text style={styles.message}>
          Ocorreu um erro inesperado. Toque em Tentar novamente para recarregar.
        </Text>
        <Text style={styles.detail} numberOfLines={3}>
          {this.state.error.message}
        </Text>
        <Pressable style={styles.button} onPress={this.handleRetry}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
  message: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  detail: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
