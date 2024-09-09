import ts from "typescript";
import { TransformerConfig, TransformerContextRetainer } from "./transformer";

/**
 * Transformer entry
 */

export default function (
  program: ts.Program,
  config: Partial<TransformerConfig>
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const retainer = new TransformerContextRetainer(config, program, context);
    return (file) => {
      return retainer.transformFile(file);
    };
  };
}
