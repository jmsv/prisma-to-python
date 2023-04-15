import type { DMMF } from "@prisma/generator-helper";
import { getDMMF } from "@prisma/internals";

export interface ConverterOptions {
  indentation: number;
}

export const defaultOptions: ConverterOptions = {
  indentation: 4,
};

const header = `# Generated by prisma-to-python - https://github.com/jmsv/prisma-to-python#readme
# Do not edit this file directly!`;

export class PrismaToPythonConverter {
  private input: string;
  private dmmf: DMMF.Document;
  private imports: { from: string; import: string }[] = [];
  private options: ConverterOptions;

  constructor(input: string, opts: Partial<ConverterOptions> = {}) {
    this.input = input;
    this.options = { ...defaultOptions, ...opts };
  }

  run = async () => {
    this.dmmf = await getDMMF({ datamodel: this.input });

    const enums = this.convertEnums(this.dmmf.datamodel.enums);
    const models = this.convertModels(this.dmmf.datamodel.models);
    const types = this.convertModels(this.dmmf.datamodel.types);

    const importsInTypeBuckets = this.imports.reduce(
      (acc, { from, import: i }) => {
        if (!acc[from]) acc[from] = [];
        if (!acc[from].includes(i)) acc[from].push(i);
        return acc;
      },
      {} as Record<string, string[]>
    );

    const importsString = Object.entries(importsInTypeBuckets)
      .map(([from, imports]) => {
        const importsString = imports.map((i) => i).join(", ");
        return `from ${from} import ${importsString}`;
      })
      .join("\n");

    return (
      header +
      "\n\n" +
      importsString +
      "\n\n# Enums\n\n" +
      enums +
      "\n\n# Types\n\n" +
      types +
      "\n\n# Models\n\n" +
      models +
      "\n"
    );
  };

  private convertEnums = (enums: DMMF.DatamodelEnum[]): string => {
    return enums
      .map((e) => {
        const name = e.name;

        const values = e.values
          .map((v) => {
            const line = `${camelToSnakeCase(v.name)} = "${v.name}"`;
            return this.indentLine(line);
          })
          .join("\n");

        this.imports.push({ from: "enum", import: "Enum" });
        return `class ${name}(str, Enum):\n${values}`;
      })
      .join("\n\n");
  };

  private convertModels = (models: DMMF.Model[]): string => {
    return models
      .map((m) => {
        const modelName = m.name;

        const fields = m.fields
          .map((f) => {
            const fieldName = f.dbName || f.name;

            if (f.relationName) return null;
            let type = f.type;
            if (f.kind === "scalar") {
              type = getScalarType(f.type);

              if (type === "datetime") {
                this.imports.push({ from: "datetime", import: "datetime" });
              } else if (type === "Any") {
                this.imports.push({ from: "typing", import: "Any" });
              }
            }
            if (f.isList) type = `list[${type}]`;
            if (!f.isRequired) {
              type = `Optional[${type}]`;
              this.imports.push({ from: "typing", import: "Optional" });
            }

            const line = `${fieldName}: ${type}`;
            return this.indentLine(line);
          })
          .filter((x) => x)
          .join("\n");

        this.imports.push({ from: "typing", import: "TypedDict" });
        return `class ${modelName}(TypedDict):\n${fields}`;
      })
      .join("\n\n");
  };

  private indentLine = (text: string, levels: number = 1) => {
    return " ".repeat(this.options.indentation * levels) + text;
  };
}

const camelToSnakeCase = (str: string) => {
  if (str === str.toUpperCase()) return str;

  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .toUpperCase();
};

const getScalarType = (scalar: string) => {
  const scalarTypeMap: { [key: string]: string } = {
    String: "str",
    Int: "int",
    Boolean: "bool",
    DateTime: "datetime",
    Json: "Any",
  };

  const type = scalarTypeMap[scalar];

  if (!type) throw new Error(`Unknown scalar type: ${scalar}`);

  return type;
};
