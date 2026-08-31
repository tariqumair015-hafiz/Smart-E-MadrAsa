async function checkMetadata(identifier) {
  try {
    const url = `https://archive.org/metadata/${identifier}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`Failed to fetch metadata: ${res.status}`)
      return
    }
    const data = await res.json()
    console.log(`Files in ${identifier}:`)
    data.files.forEach(f => {
      console.log(`- ${f.name} (${f.format})`)
    })
  } catch (err) {
    console.error(err)
  }
}

checkMetadata('bdec25')
