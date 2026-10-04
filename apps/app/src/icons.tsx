import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'clock'
  | 'calendar'
  | 'pantry'
  | 'home'
  | 'back'
  | 'send'
  | 'mic'
  | 'pulse'
  | 'timer'
  | 'search'
  | 'check'
  | 'plus'
  | 'share'
  | 'chat'
  | 'user';

/** Stroke icons from the design, drawn with the current text colour. */
export function Icon({ name, size = 22, color, strokeWidth = 2 }: { name: IconName; size?: number; color: string; strokeWidth?: number }) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={2} {...p} />
          <Path d="M4 10h16M9 3v4M15 3v4" {...p} />
        </>
      )}
      {name === 'pantry' && <Path d="M3 4h18v4H3zM4 8h16v12H4zM10 12h4" {...p} />}
      {name === 'home' && <Path d="M4 11l8-7 8 7v9H4z" {...p} />}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'send' && <Path d="M5 12h14M13 6l6 6-6 6" {...p} />}
      {name === 'mic' && (
        <>
          <Rect x={9} y={3} width={6} height={11} rx={3} {...p} />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...p} />
        </>
      )}
      {name === 'pulse' && <Path d="M3 12h4l3-8 4 16 3-8h4" {...p} />}
      {name === 'timer' && (
        <>
          <Circle cx={12} cy={13} r={8} {...p} />
          <Path d="M12 9v4l2 2M9 2h6" {...p} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...p} />
          <Path d="M20 20l-4-4" {...p} />
        </>
      )}
      {name === 'check' && <Path d="M5 12l5 5 9-10" {...p} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'share' && <Path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" {...p} />}
      {name === 'chat' && <Path d="M4 5h16v11H9l-5 4z" {...p} />}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" {...p} />
        </>
      )}
    </Svg>
  );
}
