const fs = require(`fs`)
const { onPostBuild } = require(`../gatsby-node`)
const internals = require(`../internals`)
jest.mock(`fs`)
const DATE_TO_USE = new Date(`2018`)
const _Date = Date
global.Date = jest.fn(() => DATE_TO_USE)
global.Date.UTC = _Date.UTC
global.Date.now = _Date.now

const whenWindows = { it: process.platform === "win32" ? it : it.skip }
const whenOthers = { it: process.platform === "win32" ? it.skip : it }

describe(`Test plugin feed`, async () => {
  fs.existsSync = jest.fn()
  fs.existsSync.mockReturnValue(true)

  const defaultSettingsWorkProperly = async () => {
    internals.writeFile = jest.fn()
    internals.writeFile.mockResolvedValue(true)
    const graphql = jest.fn()
    graphql.mockResolvedValue({ data: {
      site : {
        siteMetadata: {
          title: `a sample title`,
          description: `a description`,
          siteUrl: `http://dummy.url/`,
        },
      },
      allMarkdownRemark: {
        edges: [
          { node: {
            fields: {
              slug: `a-slug`,
            },
            excerpt: `post description`,
          } },
        ],
      },
    } })
    await onPostBuild({ graphql }, {})
    expect(internals.writeFile).toMatchSnapshot()
  }

  const customQueryRuns = async () => {
    internals.writeFile = jest.fn()
    internals.writeFile.mockResolvedValue(true)
    const graphql = jest.fn()
    graphql.mockResolvedValue({ data: {
      site : {
        siteMetadata: {
          title: `a sample title`,
          description: `a description`,
          siteUrl: `http://dummy.url/`,
        },
      },
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                path: `a-custom-path`,
              },
              excerpt: `post description`,
            },
          },
          {
            node: {
              frontmatter: {
                path: `another-custom-path`,
              },
              excerpt: `post description`,
            },
          },
        ],
      },
    } })
    const options = {
      feeds: [
        {
          output: `rss_new.xml`,
          serialize: ({ query: { site, allMarkdownRemark } }) =>
            allMarkdownRemark.edges.map(edge => {
              return {
                ...edge.node.frontmatter,
                description: edge.node.excerpt,
                url: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
              }
          }),
          query: `
          {
            allMarkdownRemark(
              limit: 1000,
            ) {
              edges {
                node {
                  frontmatter {
                    path
                  }
                  excerpt
                }
              }
            }
          }
        `,
      }],
    }
    await onPostBuild({ graphql }, options)
    expect(internals.writeFile).toMatchSnapshot()
    expect(graphql).toMatchSnapshot()
  }

  whenWindows.it(`custom query runs in Windows`, customQueryRuns)
  whenOthers.it(`custom query runs`, customQueryRuns)

  whenWindows.it(`default settings work properly in Windows`, defaultSettingsWorkProperly)
  whenOthers.it(`default settings work properly`, defaultSettingsWorkProperly)
})
