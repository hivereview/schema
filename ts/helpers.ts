/**
 * A module providing helper functions that are useful when
 * generating languages bindings and documentation.
 */

import { Resolver } from '@stoplight/json-ref-resolver'
import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import toposort from 'toposort'
import JsonSchema from './jsonSchema'
export { default as Schema } from './jsonSchema'

/**
 * Read the schemas from `public/*.schema.json` and dereference
 * any inline references.
 */
export async function readSchemas(
  glob: string | string[] = path.join(
    __dirname,
    '..',
    'public',
    '*.schema.json'
  )
): Promise<JsonSchema[]> {
  const files = await globby(glob)
  return Promise.all(
    files.map(async (file: string) => {
      const resolver = new Resolver()
      const resolved = await resolver.resolve(await fs.readJSON(file))
      return resolved.result
    })
  )
}

/**
 * Is a schema for a primitive type.
 */
export function isPrimitiveSchema(schema: JsonSchema): boolean {
  return schema.properties === undefined && schema.anyOf === undefined
}

/**
 * Get the 'primitive' schemas
 */
export function filterPrimitiveSchemas(schemas: JsonSchema[]): JsonSchema[] {
  return schemas.filter(isPrimitiveSchema)
}

/**
 * Get the 'interface' schemas (i.e. not union schema, not property schemas) which are
 * usually translated into `interface`s, `class`es or similar for the language.
 *
 * Types are sorted topologically so that schemas come before
 * any of their descendants.
 */
export function filterInterfaceSchemas(schemas: JsonSchema[]): JsonSchema[] {
  const types = schemas.filter((schema) => schema.properties !== undefined)
  const map = new Map(schemas.map((schema) => [schema.title, schema]))

  const edges = types.map((schema): [string, string] => [
    schema.extends !== undefined ? schema.extends : '',
    schema.title !== undefined ? schema.title : '',
  ])
  const ordered = toposort(edges).filter((title) => title !== '')

  return ordered.map((title) => {
    const schema = map.get(title)
    if (schema === undefined)
      throw new Error(`Holy smokes, "${title}" aint in da map @#!&??!`)
    return schema
  })
}

/**
 * Get the union types from the schemas
 */
export function filterUnionSchemas(schemas: JsonSchema[]): JsonSchema[] {
  return schemas.filter((schema) => schema.anyOf !== undefined)
}

/**
 * Interface for properties giving a little
 * more information on each property to be used in code generation
 */
interface Property {
  name: string
  schema: JsonSchema
  inherited: boolean
  override: boolean
  optional: boolean
}

/**
 * Get properties for a schema.
 *
 * Properties are arranged in groups according to required (or not)
 * and inherited (or not).
 */
export function getSchemaProperties(
  schema: JsonSchema
): {
  all: Property[]
  inherited: Property[]
  own: Property[]
  required: Property[]
  optional: Property[]
} {
  const { title, properties = {}, required = [] } = schema

  const props = Object.entries(properties)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([name, _]) => name !== 'type')
    .map(
      ([name, schema]): Property => {
        const { from, isOverride: override = false } = schema
        const inherited = from !== title
        const optional = required === undefined || !required.includes(name)
        return { name, schema, inherited, override, optional }
      }
    )
    .sort((a, b) => {
      if (a.optional === b.optional) {
        if (a.name === b.name) return 0
        if (a.name < b.name) return -1
        return 1
      }
      if (a.optional) return 1
      return -1
    })

  return {
    all: props,
    inherited: props.filter((prop) => prop.inherited),
    own: props.filter((prop) => !prop.inherited || prop.override),
    required: props.filter((prop) => !prop.optional),
    optional: props.filter((prop) => prop.optional),
  }
}

/**
 * Create a header for a language bindings file
 */
export function autogeneratedHeader(
  generateCommand: string,
  generator: string,
  commentDelimiter: string
): string {
  return `${commentDelimiter} This file was automatically generated by \`${generator}\`.
${commentDelimiter} Do not modify it by hand. Instead, modify the source \`.schema.yaml\` files
${commentDelimiter} in the \`schema\` directory and run \`npm run ${generateCommand}\` to regenerate it.`
}