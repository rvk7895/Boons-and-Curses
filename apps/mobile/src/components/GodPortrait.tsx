import type { GodId } from "@bc/shared";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, godPalette, radii } from "../ui/theme";

const sources: Record<GodId, ReturnType<typeof require>> = {
  zeus: require("../../assets/gods/zeus.png"),
  hephaestus: require("../../assets/gods/hephaestus.png"),
  aphrodite: require("../../assets/gods/aphrodite.png"),
  athena: require("../../assets/gods/athena.png"),
  hades: require("../../assets/gods/hades.png"),
  poseidon: require("../../assets/gods/poseidon.png"),
};

type Props = {
  god: GodId;
  size?: number;
  ring?: boolean;
  style?: ViewStyle;
};

export function GodPortrait({ god, size = 96, ring = false, style }: Props) {
  const pal = godPalette[god] ?? godPalette.zeus!;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        ring ? { borderWidth: 2, borderColor: pal.primary } : null,
        style,
      ]}
    >
      <LinearGradient
        colors={pal.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={sources[god]}
        style={styles.img}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: colors.bgDeep,
  },
  img: {
    ...StyleSheet.absoluteFillObject,
  },
});
