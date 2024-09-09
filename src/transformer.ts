import ts from "typescript";

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

  private createSpoofExpression(str: string): ts.CallExpression {
    const randos = [...str].map((_) => Math.round(Math.random() * 500 - 250));
    const create_num = (v: number) => {
      if (v >= 0) {
        return this.factory.createNumericLiteral(v);
      }
      return this.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.MinusToken,
        this.factory.createNumericLiteral(-v)
      );
    };
    const charoffsets = [...str]
      .map((ch, i) => ch.charCodeAt(0) + randos[i])
      .map(create_num);

    const mapper = randos.map(create_num);
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
                  this.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    this.factory.createIdentifier("i"),
                    undefined,
                    undefined,
                    undefined
                  ),
                ],
                undefined,
                this.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                this.factory.createBlock(
                  [
                    this.factory.createReturnStatement(
                      this.factory.createBinaryExpression(
                        this.factory.createIdentifier("x"),
                        this.factory.createToken(ts.SyntaxKind.MinusToken),
                        this.factory.createElementAccessExpression(
                          this.factory.createArrayLiteralExpression(
                            mapper,
                            false
                          ),
                          this.factory.createIdentifier("i")
                        )
                      )
                    ),
                  ],
                  true
                )
              ),
            ]
          )
        ),
      ]
    );
  }

  private transformCallExpression(node: ts.CallExpression) {
    const identifier = node.expression;
    if (!ts.isIdentifier(identifier)) return this.visitNode(node);
    const text = identifier.escapedText;
    if (text === "$spoof") {
      const str = node.arguments[0]; // must be string literal for compile time deduction
      if (str === undefined || ts.isStringLiteral(str) === false) {
        if (str === undefined && this.config.verbose) {
          console.log("[rbxts-transformer-spoof] $spoof requires a parameter!");
        }
        if (ts.isStringLiteral(str) === false && this.config.verbose) {
          console.log(
            "[rbxts-transformer-spoof] $spoof requires a string literal!"
          );
        }
        return this.visitNode(node);
      }
      return this.createSpoofExpression(str.text);
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
