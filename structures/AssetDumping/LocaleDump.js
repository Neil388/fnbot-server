// eslint-disable-next-line camelcase
import { read_locale } from 'node-wick'

export default function dump (Extractor, loc) {
  if (!Extractor) { return };
  const locales = {}
  const pak0list = Extractor.get_file_list().map((v, idx) => ({
    path: v,
    index: idx
  }))
  let Locales = pak0list.filter(i => i.path.includes('Localization/Fortnite_locchunk10/') && i.path.includes('.locres'))
  if (loc && loc instanceof Array && loc[0]) {
    Locales = Locales.filter(l => loc.includes(l.path.split('Localization/Fortnite_locchunk10/')[1].split('/')[0]))
  };
  for (let i = 0; i < Locales.length; i++) {
    const filepath = Locales[i]
    const file = Extractor.get_file(filepath.index)
    if (file != null) {
      const data = read_locale(file)
      const formattedObj = {}
      data.string_data[0].data.forEach(d => {
        formattedObj[d.key] = d.data
      })
      locales[filepath.path.split('Localization/Fortnite_locchunk10/')[1].split('/')[0]] = formattedObj
    };
  };
  console.log('  => Loaded ' + Object.keys(locales).length + ' locales: ' + Object.keys(locales).map(key => key).sort().join(', '))
  return locales
}
