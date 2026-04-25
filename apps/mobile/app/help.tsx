import { CARD_IDS, CARDS } from "@bc/shared";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GoldDivider } from "../src/ui/GoldDivider";
import { Screen } from "../src/ui/Screen";
import { colors, godPalette, radii, spacing, typography } from "../src/ui/theme";

export default function HelpScreen() {
  return (
    <Screen scroll>
      <Text style={typography.title}>HOW TO PLAY</Text>
      <GoldDivider style={{ width: 200 }} />

      <Section title="The contest">
        <Bullet>2–4 champions enter the arena. Last alive wins.</Bullet>
        <Bullet>Each player serves one of six patron gods, each with distinct stats.</Bullet>
        <Bullet>Two phases: build your champion, then battle.</Bullet>
      </Section>

      <Section title="Building phase">
        <Bullet>Take turns drawing cards. A d4 scales each card's effect.</Bullet>
        <Bullet>1–2 weakens the effect (0.5×/0.75×); 3–4 amplifies it (1.0×/1.25×).</Bullet>
        <Bullet>Buffs apply immediately. Attack cards go into your hand (max 4 held).</Bullet>
        <Bullet>Phase ends when the deck runs out or a player hits the threshold.</Bullet>
      </Section>

      <Section title="Fighting phase">
        <Bullet>Turn order each round is descending Speed.</Bullet>
        <Bullet>Play an attack from your hand against an opponent.</Bullet>
        <Bullet>STAB: cards matching your god deal +25%.</Bullet>
        <Bullet>Rivalries flip the modifier when an opponent's god opposes the card's school.</Bullet>
        <Bullet>0 HP eliminates you. The last champion is crowned.</Bullet>
      </Section>

      <Section title="Statuses">
        <Bullet>BURN — 10 HP at the start of your next turns.</Bullet>
        <Bullet>INVULN — block the next damage taken.</Bullet>
        <Bullet>LAST STAND — survive lethal once at 1 HP.</Bullet>
        <Bullet>BLACKSMITH — 10% chance to burn opponents you hit.</Bullet>
      </Section>

      <Text style={[typography.title, { marginTop: spacing.lg }]}>CARD ATLAS</Text>
      <GoldDivider style={{ width: 200 }} />
      <View style={styles.grid}>
        {CARD_IDS.map((id) => {
          const def = CARDS[id];
          const pal = godPalette[def.god] ?? godPalette.zeus!;
          return (
            <View
              key={id}
              style={[
                styles.cell,
                { borderColor: pal.primary + "44", backgroundColor: "rgba(255,255,255,0.04)" },
              ]}
            >
              <Text style={[styles.cellId, { color: pal.primary }]}>{id}</Text>
              <Text style={typography.dim}>{def.god}</Text>
              <Text style={typography.micro}>
                {def.kind} · {def.points}pts
              </Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[typography.heading, { color: colors.accent }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>·</Text>
      <Text style={styles.bullet}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulletRow: { flexDirection: "row", gap: spacing.sm },
  bulletMark: { color: colors.accent, fontSize: 18, lineHeight: 22 },
  bullet: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cell: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    minWidth: 100,
    gap: 2,
  },
  cellId: { fontWeight: "700", letterSpacing: 1, fontFamily: "Cinzel_700Bold" },
});
