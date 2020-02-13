/**
 * Generate `public/*.jsonld` files from `schema/*.schema.yaml` files.
 *
 * For custom types and properties (those not defined in other contexts) generate a JSON-LD
 * file similar to those on schema.org e.g. https://schema.org/Person.jsonld,
 * https://schema.org/sibling.jsonld
 */

import fs from 'fs-extra'
// @ts-ignore
import fromEntries from 'object.fromentries'
import path from 'path'
import { readSchemas } from '../helpers'

/**
 * Get the Schema major version for use in generated URLs
 */
const VERSION_MAJOR = fs
  .readJSONSync(path.join(__dirname, '..', '..', 'package.json'))
  .version.split('.')[0]

/**
 * The base URL for the Stencila JSON-LD context.
 *
 * This gets prefixed to all keys during JSON-LD expansion
 * so the trailing slash is important so that for e.g.
 * `CodeChunk` gets expanded to `http://schema.stenci.la/v0/jsonld/CodeChunk`
 * (which in gets redirected to `https://unpkg.com/@stencila/schema@0.32.1/dist/CodeChunk.jsonld`)
 */
const STENCILA_CONTEXT_URL = `http://schema.stenci.la/v${VERSION_MAJOR}/jsonld/`

/**
 * The destination directory for generated JSON-LD files
 */
const DEST_DIR = path.join(__dirname, '..', '..', 'public')

export const build = async (): Promise<void> => {
  await fs.ensureDir(DEST_DIR)

  const types: { [key: string]: {} } = {}
  const properties: {
    [key: string]: { '@id': string } & { [key: string]: unknown }
  } = {}

  const schemas = await readSchemas()
  for (const schema of schemas.values()) {
    const { '@id': typeId, title, properties: typeProperties } = schema

    // Skip union types, like `Node` and `BlockContent`, that do not need to
    // be represented in the `@context`.
    if (typeId === undefined || title === undefined || properties === undefined)
      continue

    if (typeId.startsWith('stencila:')) {
      types[title] = {
        '@id': typeId,
        '@type': 'schema:Class',
        'schema:name': title,
        'schema:description': schema.description
      }
    } else {
      types[title] = { '@id': typeId }
    }

    if (typeProperties !== undefined) {
      for (let [name, property] of Object.entries(typeProperties)) {
        let pid = property['@id']
        // Do not add terms that are aliases with JSON-LD keywords: @id, @type etc
        if (
          pid === undefined ||
          name === 'id' ||
          name === 'type' ||
          name === 'value'
        )
          continue
        // The `schema` property clashes with the schema.org alias. So rename it...
        if (name === 'schema') {
          name = 'scheme'
          pid = 'stencila:scheme'
        }

        if (pid.startsWith('stencila:')) {
          if (properties[name] === undefined) {
            properties[name] = {
              '@id': pid,
              '@type': 'schema:Property',
              'schema:name': name,
              'schema:description': property.description,
              'schema:domainIncludes': [{ '@id': typeId }]
            }
          } else {
            const domainIncludes = properties[name]['schema:domainIncludes']
            if (Array.isArray(domainIncludes)) {
              domainIncludes.push({ '@id': typeId })
            }
          }
        } else {
          properties[name] = {
            '@id': pid
          }
        }
      }
    }
  }

  /**
   * The main JSON-LD @context.
   *
   * Written to be similar to schema.org's @context:
   * https://schema.org/docs/jsonldcontext.jsonld
   */
  const context = {
    // Alias JSON-LD keywords e.g. `@type` and `@id`
    // For why this is useful, see "Addressing the “@” issue" at
    //    https://datalanguage.com/news/publishing-json-ld-for-developers
    type: '@type',
    id: '@id',
    value: '@value',

    // Other contexts referred to, including this one
    // Note that http vs https is important!
    schema: 'http://schema.org/',
    bioschemas: 'http://bioschemas.org',
    codemeta: 'http://doi.org/10.5063/schema/codemeta-2.0',
    stencila: STENCILA_CONTEXT_URL,

    // Define that in this context all terms derive from this vocabulary
    // (and so do not need prefixing)
    '@vocab': STENCILA_CONTEXT_URL,

    // Types and properties added in alphabetical order after this e.g
    //   "schema:AudioObject": {"@id": "schema:AudioObject"},
    ...fromEntries(
      [
        ...[...Object.entries(types)].sort(),
        ...[...Object.entries(properties)].sort()
      ].map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ([name, entry]: [string, any]) => [name, { '@id': entry['@id'] }]
      )
    )
  }

  await fs.writeJSON(
    path.join(DEST_DIR, 'stencila.jsonld'),
    { '@context': context },
    { spaces: 2 }
  )

  await Promise.all(
    Object.entries({ ...types, ...properties })
      .filter(
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([name, entry]) => entry['@id'].startsWith('stencila:')
      )
      .map(([name, entry]) =>
        fs.writeJSON(
          path.join(DEST_DIR, `${name}.jsonld`),
          {
            '@context': {
              schema: 'http://schema.org/',
              stencila: STENCILA_CONTEXT_URL
            },
            ...entry
          },
          {
            spaces: 2
          }
        )
      )
  )
}

/**
 * Run `build()` when this file is run as a Node script
 */
// eslint-disable-next-line @typescript-eslint/no-floating-promises
if (module.parent === null) build()
