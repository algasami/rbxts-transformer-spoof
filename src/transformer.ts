import ts, { isStringLiteral } from "typescript";

export type TransformerConfig = {
  verbose: boolean;
};

const defaultConfig: TransformerConfig = {
  verbose: true,
};

export class TransformerContextRetainer {
  public config: TransformerConfig;
  public factory: ts.NodeFactory;
  constructor(
    config: Partial<TransformerConfig>,
    public program: ts.Program,
    public context: ts.TransformationContext
  ) {
    this.factory = context.factory;
    this.config = { ...defaultConfig, ...config };
  }

  public transformFile(file: ts.SourceFile) {
    const transformedStatements = this.transformStatements(file.statements);
    return this.factory.updateSourceFile(
      file,
      transformedStatements,
      file.isDeclarationFile,
      file.referencedFiles,
      file.typeReferenceDirectives,
      file.hasNoDefaultLib,
      file.libReferenceDirectives
    );
  }

  private transformCallExpression(node: ts.CallExpression) {
    const identifier = node.expression;
    if (!ts.isIdentifier(identifier)) return this.visitNode(node);
    const text = identifier.escapedText;
    if (text === "$spoof") {
      const str = node.arguments[0]; // must be string literal for compile time deduction
      const offset = node.arguments[1]; // must be a numeric literal
      if (
        str === undefined ||
        offset === undefined ||
        ts.isStringLiteral(str) === false ||
        ts.isNumericLiteral(offset) === false
      ) {
        return this.visitNode(node);
      }

      const charoffsets = [...str.text]
        .map((ch) => ch.charCodeAt(0) + Number(offset.text))
        .map((v) => {
          return this.factory.createNumericLiteral(v);
        });

      return this.context.factory.createCallExpression(
        this.context.factory.createPropertyAccessExpression(
          this.context.factory.createIdentifier("string"),
          this.context.factory.createIdentifier("char")
        ),
        undefined,
        [
          this.factory.createSpreadElement(
            this.factory.createCallExpression(
              this.factory.createPropertyAccessExpression(
                this.factory.createArrayLiteralExpression(charoffsets, false),
                this.factory.createIdentifier("map")
              ),
              undefined,
              [
                this.factory.createArrowFunction(
                  undefined,
                  undefined,
                  [
                    this.factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      this.factory.createIdentifier("x"),
                      undefined,
                      undefined,
                      undefined
                    ),
                  ],
                  undefined,
                  this.factory.createToken(
                    ts.SyntaxKind.EqualsGreaterThanToken
                  ),
                  this.factory.createBinaryExpression(
                    this.factory.createIdentifier("x"),
                    this.factory.createToken(ts.SyntaxKind.MinusToken),
                    offset
                  )
                ),
              ]
            )
          ),
        ]
      );
    }
    return this.visitNode(node);
  }

  /**
   *
   * @param node Root node (it is **NOT** transformed!!!)
   * @returns a transformed node or a list of transformed nodes
   */
  private visitNode<T extends ts.Node>(node: T): T | T[] {
    return ts.visitEachChild(
      node,
      (other) => this.transformNode(other),
      this.context
    );
  }

  private transformNode(node: ts.Node): ts.Node | ts.Node[] {
    if (ts.isCallExpression(node)) {
      return this.transformCallExpression(node);
    }

    return this.visitNode(node);
  }

  private transformStatements(statementsIn: ts.NodeArray<ts.Statement>) {
    const statementsOut: Array<ts.Statement> = [];
    statementsIn.forEach((oldStatement) => {
      const output = this.visitNode(oldStatement);
      if (Array.isArray(output)) {
        statementsOut.push(...output);
      } else {
        statementsOut.push(output);
      }
    });
    return statementsOut;
  }
}
