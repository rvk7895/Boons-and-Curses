import {
  Cinzel_400Regular,
  Cinzel_700Bold,
  useFonts as useCinzel,
} from "@expo-google-fonts/cinzel";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export function useAppFonts(): boolean {
  const [loaded] = useCinzel({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  return loaded;
}
