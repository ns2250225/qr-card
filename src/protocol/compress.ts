// 压缩:优先使用浏览器原生 Compression Streams API,不可用时回退 pako
// "deflate" 为 zlib(RFC1950)格式,pako.deflate 默认输出相同格式,二者互通

export async function deflateBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const CS = (globalThis as any).CompressionStream
  if (typeof CS === 'function' && typeof Response === 'function') {
    const stream = new CS('deflate')
    const writer = stream.writable.getWriter()
    writer.write(bytes)
    writer.close()
    const buf = await new Response(stream.readable).arrayBuffer()
    return new Uint8Array(buf)
  }
  const { deflate } = await import('pako')
  return deflate(bytes)
}

export async function inflateBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const DS = (globalThis as any).DecompressionStream
  if (typeof DS === 'function' && typeof Response === 'function') {
    const stream = new DS('deflate')
    const writer = stream.writable.getWriter()
    writer.write(bytes)
    writer.close()
    const buf = await new Response(stream.readable).arrayBuffer()
    return new Uint8Array(buf)
  }
  const { inflate } = await import('pako')
  return inflate(bytes)
}
