import { useAppTheme } from '@/theme/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Circle, Defs, LinearGradient, Path, Stop, Svg, Text as SvgText } from 'react-native-svg';

export type SparkDatum = { value: number; label?: string };

type Props = {
  data: SparkDatum[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showLabels?: boolean;
};

export function Sparkline({ data, height = 80, color, showDots = true, showLabels = true }: Props) {
  const { colors } = useAppTheme();
  const lineColor = color ?? colors.accent;
  const [containerWidth, setContainerWidth] = useState(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(8)).current;
  const gradId = useRef(`sg_${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (containerWidth === 0) return;
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 500, delay: 150, useNativeDriver: true }),
    ]).start();
  }, [containerWidth]);

  if (data.length < 2) return null;

  const PAD_H = showLabels ? 20 : 6;
  const PAD_V_TOP = 10;
  const PAD_V_BOT = showLabels ? 24 : 6;

  function buildSvg(w: number) {
    const chartW = w - PAD_H * 2;
    const chartH = height - PAD_V_TOP - PAD_V_BOT;

    const values = data.map(d => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV === minV ? 1 : maxV - minV;

    const xs = data.map((_, i) => PAD_H + (i / (data.length - 1)) * chartW);
    const ys = values.map(v =>
      PAD_V_TOP + (maxV === minV ? chartH / 2 : (1 - (v - minV) / range) * chartH)
    );

    const lineParts: string[] = [`M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`];
    for (let i = 1; i < data.length; i++) {
      const t = (xs[i] - xs[i - 1]) / 3;
      lineParts.push(
        `C ${(xs[i - 1] + t).toFixed(2)} ${ys[i - 1].toFixed(2)} ${(xs[i] - t).toFixed(2)} ${ys[i].toFixed(2)} ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`
      );
    }
    const linePath = lineParts.join(' ');
    const fillBase = height - PAD_V_BOT;
    const fillPath = `${linePath} L ${xs[xs.length - 1].toFixed(2)} ${fillBase} L ${xs[0].toFixed(2)} ${fillBase} Z`;

    return (
      <Svg width={w} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.28" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Path d={fillPath} fill={`url(#${gradId})`} />

        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {showDots && data.map((_, i) => (
          <Circle
            key={i}
            cx={xs[i]}
            cy={ys[i]}
            r={i === data.length - 1 ? 4.5 : 3}
            fill={i === data.length - 1 ? lineColor : '#fff'}
            stroke={lineColor}
            strokeWidth={1.5}
          />
        ))}

        {showLabels && data.map((d, i) =>
          d.label ? (
            <SvgText
              key={`l${i}`}
              x={xs[i]}
              y={height - 5}
              fontSize={9}
              fill="#AAAAAA"
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          ) : null
        )}
      </Svg>
    );
  }

  return (
    <View
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ width: '100%' }}
    >
      {containerWidth > 0 && (
        <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: translateYAnim }] }}>
          {buildSvg(containerWidth)}
        </Animated.View>
      )}
    </View>
  );
}
