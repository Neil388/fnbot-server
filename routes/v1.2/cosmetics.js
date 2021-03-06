const Assets = {
  ...global.assets
}

const tlist = {
  backpack: 'backpacks',
  emote: 'emotes',
  pickaxe: 'pickaxes',
  skin: 'skins',
  emoji: 'emojis',
  cid: 'skins',
  eid: 'emotes',
  bid: 'backpacks',
  pic: 'pickaxes'
}
const types = type => {
  if (!Object.keys(tlist).includes(type) && !Object.values(tlist).includes(type)) return null
  return tlist[type] || type
}

function prepareImage (img, baseurl) {
  if (!img || !baseurl) return null
  return baseurl + 'icons/' + img
};

function prepareObject (asset, baseurl) {
  return {
    id: asset.id,
    name: asset.name,
    image: prepareImage(asset.image, baseurl),
    variants: asset.variants || undefined
  }
};

export const routes = [{
  name: '/cosmetics/search',
  run (req, res) {
    const input = {
      query: req.headers.query || req.query.query,
      type: req.headers.type || req.query.type
    }
    if (!input.query) return res.status(400).json({ statusCode: 400, msg: 'Missing search query' })
    if (!input.type) return res.status(400).json({ statusCode: 400, msg: 'Missing type query' })
    const type = types(input.type)
    if (!type) return res.status(400).json({ statusCode: 400, msg: 'Invalid type' })
    let Match = (
      Assets[type].filter(a => a.name && Object.keys(a.name).filter(b => a.name[b].toLowerCase() === input.query.toLowerCase())[0])[0] || // Name match
      Assets[type].filter(a => a.id && a.id.toLowerCase() === input.query.toLowerCase())[0] // ID match
    )
    if (input.query.toLowerCase() === 'random') {
      Match = Assets[type][Math.floor(Math.random() * Assets[type].length)]
    };
    if (!Match && type === 'skins' && parseInt(input.query)) {
      Match = Assets[type].filter(a => a.id && a.id.toLowerCase().split('cid_')[1] && parseInt(a.id.toLowerCase().split('cid_')[1].split('_')[0]) && parseInt(a.id.toLowerCase().split('cid_')[1].split('_')[0]) === parseInt(input.query))[0]
    };
    if (Match) {
      Match.baseUrl = req.baseUrl
      const data = prepareObject(Match, req.baseUrl)
      data.matches = []
      if (type !== 'emotes' && Match.setParts && Match.setParts[0]) {
        const typeOptions = {
          skins: 5,
          backpacks: 2,
          pickaxes: 3
        }
        Match.setParts.forEach(part => {
          let matches = false
          const asset = Assets[types(part.split(':')[1])].filter(a => a.id === part.split(':')[0])[0]
          asset.type = types(part.split(':')[1])
          if (!asset) return undefined
          if (type === asset.type) return undefined
          if (!typeOptions[asset.type]) return undefined
          if (asset.id.split('_').slice(typeOptions[asset.type]).join('_') === Match.id.split('_').slice(typeOptions[type]).join('_')) matches = true
          if (matches) {
            data.matches.push({
              id: asset.id,
              type: part.split(':')[1]
            })
          }
        })
      };
      return res.status(200).json({
        statusCode: 200,
        data
      })
    };
    return res.status(404).json({
      statusCode: 404,
      data: null,
      msg: 'no_results'
    })
  },
  description: 'Searches for a specific asset (requires queries query and type).'
},
{
  name: '/variants/search',
  run (req, res) {
    const input = {
      item: req.headers.item || req.query.item,
      query: req.headers.query || req.query.query,
      type: req.headers.type || req.query.type
    }
    if (!input.item) return res.status(400).json({ statusCode: 400, msg: 'Missing item query' })
    if (!input.query) return res.status(400).json({ statusCode: 400, msg: 'Missing search query' })
    if (!input.type) return res.status(400).json({ statusCode: 400, msg: 'Missing type query' })
    const type = types(input.type)
    if (!type || !Assets[type]) return res.status(400).json({ statusCode: 400, msg: 'Invalid type' })
    const ItemMatch = (
      Assets[type].find(a => a.name && Object.keys(a.name).filter(b => a.name[b].toLowerCase() === input.item.toLowerCase())[0]) || // Name match
      Assets[type].find(a => a.id && a.id.toLowerCase() === input.item.toLowerCase()) // ID match
    )
    if (!ItemMatch) return res.status(404).json({ statusCode: 404, data: null, msg: 'invalid_item' })
    if (!ItemMatch.variants || !ItemMatch.variants[0]) return res.status(404).json({ statusCode: 404, data: null, msg: 'no_results' })
    const Match = (
      ItemMatch.variants.filter(t => t.tags && t.tags.filter(a => a.name && Object.keys(a.name).filter(b => a.name[b].toLowerCase() === input.query.toLowerCase())[0])[0])[0] || // Name match
      ItemMatch.variants.filter(t => t.tags && t.tags.filter(a => a.tag && a.tag.toLowerCase() === input.query.toLowerCase())[0])[0] // ID match
    )
    if (Match) {
      const MatchTag = (
        Match.tags.filter(a => a.name && Object.keys(a.name).filter(b => a.name[b].toLowerCase() === input.query.toLowerCase())[0])[0] ||
        Match.tags.filter(a => a.tag && a.tag.toLowerCase() === input.query.toLowerCase())[0]
      )
      return res.status(200).json({ statusCode: 200, data: { parent: ItemMatch.id, channel: Match.channel, tag: MatchTag.tag, name: MatchTag.name } })
    };
    return res.status(404).json({
      statusCode: 404,
      data: null,
      msg: 'no_results'
    })
  },
  description: 'Searches for a specific variant of a cosmetic.'
},
{
  name: '/icons/:icon',
  run (req, res) {
    const basepath = process.cwd() + '/storage/icons/'
    const icons = global.icons
    if (!req.params.icon) return res.status(404).send('Missing required param icon.')
    if (req.params.icon.split('.')[req.params.icon.split('.').length - 1] !== 'png') req.params.icon += '.png'
    if (!icons || !icons[0] || !icons.includes(req.params.icon)) return res.status(404).send('No results.')
    return res.status(200).sendFile(basepath + req.params.icon)
  }
}
]
