import type { IWorldDataProvider } from "@/types";
import { StaticWorldDataProvider } from "./static-provider";

let instance: IWorldDataProvider | null = null;

/**
 * The one entry point to portfolio content. Consumers depend on the
 * {@link IWorldDataProvider} interface, never on a concrete source — so the
 * source can change here alone (Dependency Inversion).
 */
export function getDataProvider(): IWorldDataProvider {
  instance ??= new StaticWorldDataProvider();
  return instance;
}

export { StaticWorldDataProvider };
