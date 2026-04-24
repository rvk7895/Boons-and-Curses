import { CARD_IDS, CARDS } from "@bc/shared";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/ui/Screen";
import { colors, radii, spacing, typography } from "../src/ui/theme";

export default function HelpScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={typography.heading}>How to play</Text>

        <Section title="1. Setup">
          <Bullet>2-4 players share a room code and launch the app.</Bullet>
          <Bullet>Each player is assigned one of six patron gods.</Bullet>
          <Bullet>Gods have different base stats and card affinities.</Bullet>
        </Section>

        <Section title="2. Building phase">
          <Bullet>Players take turns drawing one card at a time.</Bullet>
          <Bullet>
            Each draw rolls a d4. 1-2 weaken the effect (0.5x/0.75x); 3-4 amplify it
            (1.0x/1.25x).
          </Bullet>
          <Bullet>
            Buffs apply immediately to your champion. Attacks go into your hand
            (max 4 held).
          </Bullet>
          <Bullet>
            The first player to hit the point threshold ends the building phase.
          </Bullet>
        </Section>

        <Section title="3. Fighting phase">
          <Bullet>Turn order each round is speed-descending.</Bullet>
          <Bullet>
            On your turn, play an attack card from your hand, targeting an opponent.
          </Bullet>
          <Bullet>If a card shares your god's prefix, STAB adds +25% damage.</Bullet>
          <Bullet>
            If an opponent's god is a rival of the card's school, you lose 25% output
            and take 25% more.
          </Bullet>
          <Bullet>At 0 HP you're eliminated. Last champion wins.</Bullet>
        </Section>

        <Section title="4. Status effects">
          <Bullet>BURN: -10 HP at the start of your next turns.</Bullet>
          <Bullet>INVULNERABLE: all damage is blocked (10% chance doubled).</Bullet>
          <Bullet>LAST STAND: -5 HP bleed per turn, survives lethal once.</Bullet>
          <Bullet>BLACKSMITH: 10% chance to burn whoever you hit.</Bullet>
        </Section>

        <Text style={[typography.heading, { marginTop: spacing.lg }]}>Card reference</Text>
        <View style={styles.grid}>
          {CARD_IDS.map((id) => {
            const def = CARDS[id];
            return (
              <View key={id} style={styles.cell}>
                <Text style={styles.cellId}>{id}</Text>
                <Text style={styles.cellGod}>{def.god}</Text>
                <Text style={styles.cellKind}>
                  {def.kind} · {def.points}pts
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  root: { gap: spacing.md, paddingBottom: spacing.xl },
  section: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.bgElev,
    borderRadius: radii.md,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bulletRow: { flexDirection: "row", gap: spacing.sm },
  bulletMark: { color: colors.accent, fontSize: 16 },
  bullet: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cell: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElev,
    minWidth: 90,
    gap: 2,
  },
  cellId: { color: colors.accent, fontWeight: "700", letterSpacing: 1 },
  cellGod: { color: colors.text, fontSize: 12 },
  cellKind: { color: colors.textDim, fontSize: 11 },
});
