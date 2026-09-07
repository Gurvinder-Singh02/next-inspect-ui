type AttrMap = Record<string, string>

const createNode = (tag: string, namespaceURI: string | null = null) => {
  const attrs: AttrMap = {}
  const children: ReturnType<typeof createNode>[] = []
  const props: Record<string, string> = {}
  const node = {
    tagName: tag.toUpperCase(),
    namespaceURI,
    parentElement: null as ReturnType<typeof createNode> | null,
    children,
    attrs,
    style: {
      setProperty(name: string, value: string) {
        props[name] = value
      },
      getPropertyValue(name: string) {
        return props[name] ?? ""
      },
    },
    textContent: "",
    className: "",
    classList: {
      toggle(name: string, force?: boolean) {
        const parts = new Set(node.className.split(/\s+/).filter(Boolean))
        const on = force ?? !parts.has(name)
        if (on) parts.add(name)
        else parts.delete(name)
        node.className = [...parts].join(" ")
        return on
      },
      contains(name: string) {
        return node.className.split(/\s+/).filter(Boolean).includes(name)
      },
    },
    get outerHTML() {
      return `<${tag}></${tag}>`
    },
    get childElementCount() {
      return children.length
    },
    setAttribute(name: string, value: string) {
      attrs[name] = value
    },
    getAttribute(name: string) {
      return attrs[name] ?? null
    },
    hasAttribute(name: string) {
      return name in attrs
    },
    toggleAttribute(name: string, force?: boolean) {
      const on = force ?? !(name in attrs)
      if (on) attrs[name] = ""
      else delete attrs[name]
    },
    append(...nodes: ReturnType<typeof createNode>[]) {
      for (const child of nodes) {
        child.parentElement = node
        children.push(child)
      }
    },
    querySelector(selector: string) {
      return queryAll(node, selector)[0] ?? null
    },
    querySelectorAll(selector: string) {
      return queryAll(node, selector)
    },
    closest(selector: string) {
      const names = selector.split(",").map((part) => part.trim())
      let current: ReturnType<typeof createNode> | null = node
      while (current) {
        if (names.some((name) => matches(current!, name))) return current
        current = current.parentElement
      }
      return null
    },
    replaceChildren() {
      children.length = 0
    },
    remove() {
      const parent = node.parentElement
      if (!parent) return
      const index = parent.children.indexOf(node)
      if (index >= 0) parent.children.splice(index, 1)
      node.parentElement = null
    },
  }
  return node
}

const attrSelector = (selector: string) => {
  const match = selector.match(/^([a-z-]+)?\[([^\]]+)\]$/i)
  if (!match) return null
  return { tag: match[1]?.toLowerCase() ?? null, attr: match[2] }
}

const matches = (node: ReturnType<typeof createNode>, selector: string) => {
  if (selector === "path" || selector === "svg") {
    return node.tagName.toLowerCase() === selector
  }
  const parsed = attrSelector(selector)
  if (!parsed) return false
  if (parsed.tag && node.tagName.toLowerCase() !== parsed.tag) return false
  return parsed.attr in node.attrs
}

const queryAll = (
  root: ReturnType<typeof createNode>,
  selector: string
): ReturnType<typeof createNode>[] => {
  const found: ReturnType<typeof createNode>[] = []
  const walk = (node: ReturnType<typeof createNode>) => {
    for (const child of node.children) {
      if (matches(child, selector)) found.push(child)
      walk(child)
    }
  }
  walk(root)
  return found
}

export const registerDom = () => {
  if (globalThis.document) return
  const html = createNode("html")
  const head = createNode("head")
  const body = createNode("body")
  html.append(head, body)
  const document = {
    documentElement: html,
    head,
    body,
    createElement: (tag: string) => createNode(tag),
    createElementNS: (namespace: string, tag: string) => createNode(tag, namespace),
    querySelector: (selector: string) => html.querySelector(selector),
    querySelectorAll: (selector: string) => html.querySelectorAll(selector),
  }
  Object.assign(globalThis, { document })
}
