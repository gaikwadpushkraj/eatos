import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fonts, useTheme } from './theme';
import type { Colors } from './theme';
import { Icon } from './icons';
import type { IconName } from './icons';

export const WIDE = 1000;

export function useWide() {
  return useWindowDimensions().width >= WIDE;
}

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'label' | 'mono';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.semibold, fontSize: 34, letterSpacing: -0.6, lineHeight: 40 },
  h1: { fontFamily: fonts.semibold, fontSize: 26, letterSpacing: -0.5, lineHeight: 32 },
  h2: { fontFamily: fonts.semibold, fontSize: 20, letterSpacing: -0.2, lineHeight: 26 },
  h3: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.4, lineHeight: 16 },
};

export function Txt({ v = 'body', color, style, children, numberOfLines }: { v?: Variant; color?: keyof Colors; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number }) {
  const { c } = useTheme();
  const defaultColor: keyof Colors = v === 'small' || v === 'mono' || v === 'label' ? 'muted' : 'text';
  return (
    <Text numberOfLines={numberOfLines} style={[variants[v], { color: c[color ?? defaultColor] }, style]}>
      {children}
    </Text>
  );
}

/** Page wrapper: safe area, scroll, centred column on wide screens. */
export function Screen({ children, scroll = true, maxWidth = 720, header, footer }: { children: ReactNode; scroll?: boolean; maxWidth?: number; header?: ReactNode; footer?: ReactNode }) {
  const { c } = useTheme();
  const inner = <View style={[styles.column, { maxWidth }]}>{children}</View>;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: c.bg }}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1 }]}>{inner}</View>
      )}
      {footer ? <View style={[styles.column, { maxWidth, paddingHorizontal: 20, paddingBottom: 16 }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** Top bar with a back button for pushed screens. */
export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={[styles.topBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.iconBtn}
      >
        <Icon name="back" color={c.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Txt v="h3">{title}</Txt>
        {subtitle ? <Txt v="mono">{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

type Tone = 'default' | 'ink' | 'accent' | 'warn' | 'ok' | 'soft';

export function Card({ tone = 'default', children, style, padding = 16 }: { tone?: Tone; children: ReactNode; style?: StyleProp<ViewStyle>; padding?: number }) {
  const { c } = useTheme();
  const tones: Record<Tone, ViewStyle> = {
    default: { backgroundColor: c.surface, borderColor: c.border },
    ink: { backgroundColor: c.ink, borderColor: c.ink },
    accent: { backgroundColor: c.surface, borderColor: c.accent, borderWidth: 2 },
    warn: { backgroundColor: c.warnBg, borderColor: c.warnBorder },
    ok: { backgroundColor: c.okBg, borderColor: c.okBg },
    soft: { backgroundColor: c.surfaceAlt, borderColor: c.surfaceAlt },
  };
  return <View style={[styles.card, { padding }, tones[tone], style]}>{children}</View>;
}

type BtnKind = 'primary' | 'lime' | 'outline' | 'ink' | 'ghost' | 'onInk';

export function Btn({ label, onPress, kind = 'primary', icon, disabled, style, accessibilityLabel, small }: { label: string; onPress?: () => void; kind?: BtnKind; icon?: IconName; disabled?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; small?: boolean }) {
  const { c } = useTheme();
  const kinds: Record<BtnKind, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent },
    lime: { bg: c.lime, fg: c.onLime, border: c.lime },
    outline: { bg: c.surface, fg: c.text, border: c.borderStrong },
    ink: { bg: c.text, fg: c.bg, border: c.text },
    ghost: { bg: 'transparent', fg: c.accentText, border: 'transparent' },
    onInk: { bg: 'transparent', fg: c.inkText, border: c.inkBorder },
  };
  const k = kinds[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { minHeight: small ? 44 : 48, backgroundColor: k.bg, borderColor: k.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={k.fg} /> : null}
      <Text style={[variants.bodyStrong, { color: k.fg, fontFamily: fonts.semibold, fontSize: small ? 14 : 15 }]}>{label}</Text>
    </Pressable>
  );
}

export function IconBtn({ icon, label, onPress, filled }: { icon: IconName; label: string; onPress?: () => void; filled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.iconBtn, filled && { backgroundColor: c.accent, borderRadius: 22 }]}
    >
      <Icon name={icon} size={20} color={filled ? c.onAccent : c.text} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone }: { label: string; selected?: boolean; onPress?: () => void; tone?: 'warn' | 'ok' | 'accent' }) {
  const { c } = useTheme();
  const toneBg = tone === 'warn' ? c.warnBg : tone === 'ok' ? c.okBg : tone === 'accent' ? c.accentSoft : c.surfaceAlt;
  const toneFg = tone === 'warn' ? c.warnText : tone === 'ok' ? c.okText : tone === 'accent' ? c.accentText : c.text;
  const body = (
    <Text style={[variants.small, { color: selected ? c.bg : toneFg, fontFamily: fonts.medium }]}>{label}</Text>
  );
  if (!onPress) return <View style={[styles.chip, { backgroundColor: toneBg }]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chipBtn, { backgroundColor: selected ? c.text : c.surface, borderColor: selected ? c.text : c.borderStrong }]}
    >
      {body}
    </Pressable>
  );
}

export function Meter({ value, color }: { value: number; color?: string }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: c.border }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: color ?? c.accent }} />
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt v="label">{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderStrong, color: c.text }, props.style]}
      />
    </View>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="body">{label}</Txt>
        {hint ? <Txt v="small">{hint}</Txt> : null}
      </View>
      <View style={[styles.switch, { backgroundColor: value ? c.accent : c.borderStrong }]}>
        <View style={[styles.knob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

export function Check({ label, checked, onChange, detail }: { label: string; checked: boolean; onChange: (v: boolean) => void; detail?: string }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} onPress={() => onChange(!checked)} style={styles.checkRow}>
      <View style={[styles.box, { borderColor: checked ? c.accent : c.muted, backgroundColor: checked ? c.accent : 'transparent' }]}>
        {checked ? <Icon name="check" size={14} color={c.onAccent} strokeWidth={3} /> : null}
      </View>
      <Text style={[variants.body, { flex: 1, color: checked ? c.muted : c.text, textDecorationLine: checked ? 'line-through' : 'none' }]}>{label}</Text>
      {detail ? <Txt v="small">{detail}</Txt> : null}
    </Pressable>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt v="label">{title}</Txt>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Row({ children, gap = 10, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Dot({ color }: { color: string }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

export function Avatar({ name, tone = 'accent' }: { name: string; tone?: 'accent' | 'ok' | 'warn' }) {
  const { c } = useTheme();
  const bg = tone === 'ok' ? c.okBg : tone === 'warn' ? c.warnBg : c.accentSoft;
  const fg = tone === 'ok' ? c.okText : tone === 'warn' ? c.warnText : c.accentText;
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: fg, fontFamily: fonts.semibold, fontSize: 15 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  column: { width: '100%', alignSelf: 'center', gap: 16 },
  topBar: { minHeight: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 20, borderWidth: 1, gap: 10 },
  btn: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  chipBtn: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, justifyContent: 'center' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15 },
  toggleRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  switch: { width: 46, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  checkRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
