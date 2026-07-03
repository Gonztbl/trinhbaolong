import { useEffect } from 'react'

function App() {
  // WebGL Shader Background
  useEffect(() => {
    const canvas = document.getElementById('shader-bg')
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const vsSource = `
      attribute vec4 a_position;
      varying vec2 v_texCoord;
      void main() {
          gl_Position = a_position;
          v_texCoord = a_position.xy * 0.5 + 0.5;
      }
    `
    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
          vec2 uv = v_texCoord;
          vec2 mouse = u_mouse / u_resolution;

          float n = noise(uv * 4.0 + u_time * 0.1);
          n += 0.5 * noise(uv * 8.0 - u_time * 0.2);

          float dist = distance(uv, mouse);
          float glow = smoothstep(0.4, 0.0, dist) * 0.3;

          vec3 color1 = vec3(0.027, 0.075, 0.173);
          vec3 color2 = vec3(0.0, 0.447, 1.0);
          vec3 color3 = vec3(0.0, 1.0, 0.8);

          vec3 finalColor = mix(color1, color2, n);
          finalColor += color3 * pow(n, 4.0) * 0.5;
          finalColor += color2 * glow;

          float grid = abs(sin(uv.y * 100.0 + u_time)) * 0.03;
          finalColor += grid;

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    function createShader(gl, type, source) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, 1.0,
       1.0, 1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ]), gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse')

    let mouseX = 0
    let mouseY = 0

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = window.innerHeight - e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize)
    resize()

    let animId
    function render(time) {
      gl.uniform1f(timeLocation, time * 0.001)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform2f(mouseLocation, mouseX, mouseY)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Hero Parallax
  useEffect(() => {
    const heroContainer = document.getElementById('hero-parallax')
    const onMouseMove = (e) => {
      if (!heroContainer) return
      const x = (e.clientX / window.innerWidth - 0.5) * 30
      const y = (e.clientY / window.innerHeight - 0.5) * 30
      heroContainer.style.transform = `translate(${x}px, ${y}px)`
    }
    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [])

  // Scroll Reveal
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <canvas id="shader-bg"></canvas>
      <div className="mesh-bg"></div>
      <div className="grid-overlay"></div>

      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 max-w-[1280px] mx-auto bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <div className="font-headline-md text-headline-md font-bold text-primary drop-shadow-[0_0_8px_rgba(173,198,255,0.5)]">
          TBL ARCHITECT
        </div>
        <div className="hidden md:flex space-x-8 items-center">
          <a className="text-primary font-bold border-b-2 border-primary pb-1 font-body-lg text-body-lg" href="#systems">Systems</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-body-lg text-body-lg" href="#stack">Stack</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-body-lg text-body-lg" href="#history">History</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-body-lg text-body-lg" href="#works">Works</a>
        </div>
        <button className="btn-scan bg-primary-container text-on-primary-container px-6 py-2 rounded font-label-caps text-label-caps hover:bg-white/5 transition-all duration-300 scale-95 active:scale-90 hidden md:block border border-transparent hover:border-primary">
          Contact
        </button>
      </nav>

      <main className="pt-32 pb-section-gap px-gutter max-w-container-max mx-auto space-y-section-gap relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-16 min-h-[70vh]" id="systems">
          <div className="flex-1 space-y-8 z-10">
            <div className="space-y-4">
              <h2 className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">AI Automation Engineer</h2>
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
                Trịnh Bảo <span className="text-gradient">Long</span>
              </h1>
              <p className="font-headline-md text-headline-md text-on-surface-variant max-w-2xl">
                Synthetic Intelligence Architect
              </p>
            </div>
            <p className="font-body-lg text-body-lg text-outline max-w-xl leading-relaxed">
              Engineering sophisticated AI systems. Specializing in Retrieval-Augmented Generation (RAG)
              pipelines, Multi-Agent architectures, and scalable AI automation solutions that bridge complex data
              with human-centric interfaces.
            </p>
            <div className="flex gap-4 pt-4">
              <button className="btn-scan bg-primary text-on-primary px-8 py-4 rounded font-label-caps text-label-caps hover:bg-primary-fixed transition-colors">
                Explore Works
              </button>
              <button className="btn-scan border border-secondary text-secondary px-8 py-4 rounded font-label-caps text-label-caps hover:bg-secondary/10 transition-colors">
                View Stack
              </button>
            </div>
          </div>
          <div className="flex-1 relative w-full aspect-square max-w-md mx-auto lg:max-w-none hero-parallax-container" id="hero-parallax">
            <div className="absolute inset-0 bg-secondary/20 blur-[100px] rounded-full"></div>
            <img
              alt="AI Futuristic Robotic Arm or Abstract Interface"
              className="relative z-10 w-full h-full object-cover hero-morph drop-shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtI6elSl4ODor57Q68giyLmrvnPkRr6f7L6fqSDf0PrKrQiLIF69R63KhCC1BPpKXUR6ooR94MxHJdou7O0eV2Cabp4EC8gfrMNzfSANJDU4lpC-iarmTPS6tusxjt9gADWLJPLckVx_iGlmnPr6VSWw0QnfECQNoLnNJSQz_675qcQ_tIXOdk8egJ3xzTm6dVSlVDZMOdPakn-8aLL1vsVEXqEnL_zQnIpaEgoxZKXZ-t_SBMC8Su"
            />
          </div>
        </section>

        {/* Skills Section (Stack) */}
        <section className="relative reveal" id="stack">
          <div className="mb-12">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Technical Stack</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI & ML */}
            <div className="glass-panel p-8 rounded-xl glow-hover">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">psychology</span>
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface">AI &amp; ML</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> RAG Pipelines
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Multi-Agent Systems
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> LLM Fine-tuning
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Prompt Engineering
                </li>
              </ul>
            </div>
            {/* Database & Tools */}
            <div className="glass-panel p-8 rounded-xl glow-hover">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">database</span>
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface">Data &amp; Infra</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Vector Databases
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> PostgreSQL / NoSQL
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Docker &amp; Kubernetes
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Cloud Platforms (AWS/GCP)
                </li>
              </ul>
            </div>
            {/* Programming */}
            <div className="glass-panel p-8 rounded-xl glow-hover">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">terminal</span>
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface">Languages</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Python
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> TypeScript / Node.js
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Go
                </li>
                <li className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> C++
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Experience Section (History) */}
        <section className="relative reveal" id="history">
          <div className="mb-12">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Operational History</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-transparent"></div>
          </div>
          <div className="relative pl-8 md:pl-0">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px timeline-line -translate-x-1/2"></div>
            <div className="space-y-16">
              {/* Role 1 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group">
                <div className="md:w-5/12 w-full glass-panel p-6 rounded-xl glow-hover relative z-10 md:text-right order-2 md:order-1 mt-6 md:mt-0">
                  <h3 className="font-body-lg text-body-lg font-bold text-primary">AI Automation Engineer</h3>
                  <div className="font-label-caps text-label-caps text-secondary mb-4">IART HOLDING</div>
                  <p className="font-body-md text-body-md text-outline">Architecting and deploying multi-agent
                    systems for enterprise automation. Developed proprietary RAG pipelines to optimize
                    internal knowledge retrieval and decision-making processes.</p>
                </div>
                <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-background border-2 border-secondary rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(76,215,246,0.5)] z-20 md:order-2 group-hover:shadow-[0_0_20px_rgba(76,215,246,0.8)] transition-shadow"></div>
                <div className="md:w-5/12 w-full order-1 md:order-3">
                  <span className="font-label-caps text-label-caps text-outline-variant block md:pl-8">2023 - Present</span>
                </div>
              </div>
              {/* Role 2 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group">
                <div className="md:w-5/12 w-full order-1 md:order-1 md:text-right">
                  <span className="font-label-caps text-label-caps text-outline-variant block md:pr-8">2021 - 2023</span>
                </div>
                <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(173,198,255,0.5)] z-20 md:order-2 group-hover:shadow-[0_0_20px_rgba(173,198,255,0.8)] transition-shadow"></div>
                <div className="md:w-5/12 w-full glass-panel p-6 rounded-xl glow-hover relative z-10 order-2 md:order-3 mt-6 md:mt-0">
                  <h3 className="font-body-lg text-body-lg font-bold text-primary">AI Developer / Instructor</h3>
                  <div className="font-label-caps text-label-caps text-secondary mb-4">VTI Education</div>
                  <p className="font-body-md text-body-md text-outline">Led curriculum development for advanced
                    machine learning modules. Mentored cohorts in practical application of neural networks
                    and foundational AI programming.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section (Works) */}
        <section className="relative reveal" id="works">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Featured Systems</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-transparent"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col group glow-hover h-full">
              <div className="h-48 relative overflow-hidden bg-surface-container-high flex items-center justify-center border-b border-white/5">
                <span className="material-symbols-outlined text-6xl text-primary/30 group-hover:text-primary/60 transition-colors group-hover:scale-110 duration-500">smart_toy</span>
                <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur px-3 py-1 rounded font-label-caps text-label-caps text-secondary text-[10px]">
                  RAG / LLM
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                  Agent Rag Chat Bot
                </h3>
                <p className="font-body-md text-body-md text-outline mb-6 flex-1">An intelligent conversational
                  agent utilizing advanced Retrieval-Augmented Generation to process and answer queries based
                  on custom enterprise knowledge bases with high accuracy.</p>
                <div className="flex gap-4">
                  <button className="btn-scan flex items-center gap-2 px-4 py-2 bg-primary/10 rounded text-primary hover:text-secondary font-label-caps text-label-caps transition-colors border border-primary/20 hover:border-primary/50">
                    <span className="material-symbols-outlined text-sm">code</span> View Core
                  </button>
                </div>
              </div>
            </div>
            {/* Project 2 */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col group glow-hover h-full">
              <div className="h-48 relative overflow-hidden bg-surface-container-high flex items-center justify-center border-b border-white/5">
                <span className="material-symbols-outlined text-6xl text-primary/30 group-hover:text-primary/60 transition-colors group-hover:scale-110 duration-500">account_balance_wallet</span>
                <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur px-3 py-1 rounded font-label-caps text-label-caps text-secondary text-[10px]">
                  FINTECH / ML
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                  SmartPay IO (E-Wallet)
                </h3>
                <p className="font-body-md text-body-md text-outline mb-6 flex-1">Integrated AI-driven fraud
                  detection and predictive spending analytics into a high-performance electronic wallet
                  ecosystem, ensuring secure and smart transactions.</p>
                <div className="flex gap-4">
                  <button className="btn-scan flex items-center gap-2 px-4 py-2 bg-primary/10 rounded text-primary hover:text-secondary font-label-caps text-label-caps transition-colors border border-primary/20 hover:border-primary/50">
                    <span className="material-symbols-outlined text-sm">open_in_new</span> Live Demo
                  </button>
                </div>
              </div>
            </div>
            {/* Project 3 */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col group glow-hover h-full">
              <div className="h-48 relative overflow-hidden bg-surface-container-high flex items-center justify-center border-b border-white/5">
                <span className="material-symbols-outlined text-6xl text-primary/30 group-hover:text-primary/60 transition-colors group-hover:scale-110 duration-500">energy_savings_leaf</span>
                <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur px-3 py-1 rounded font-label-caps text-label-caps text-secondary text-[10px]">
                  COMPUTER VISION
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                  Fruit Ripeness System
                </h3>
                <p className="font-body-md text-body-md text-outline mb-6 flex-1">A computer vision application
                  utilizing CNNs to analyze and classify the ripeness stages of agricultural produce in
                  real-time, optimizing supply chain sorting.</p>
                <div className="flex gap-4">
                  <button className="btn-scan flex items-center gap-2 px-4 py-2 bg-primary/10 rounded text-primary hover:text-secondary font-label-caps text-label-caps transition-colors border border-primary/20 hover:border-primary/50">
                    <span className="material-symbols-outlined text-sm">article</span> Case Study
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 text-center glass-panel rounded-2xl border border-secondary/20 overflow-hidden reveal">
          <div className="absolute inset-0 bg-secondary/5 blur-[50px]"></div>
          <div className="relative z-10 max-w-2xl mx-auto px-6">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6">{"Let's Build the Future"}</h2>
            <p className="font-body-lg text-body-lg text-outline mb-10">Seeking a Synthetic Intelligence Architect to
              engineer your next automated ecosystem? Initiate communication protocols below.</p>
            <button className="btn-scan bg-primary text-on-primary px-10 py-4 rounded font-label-caps text-label-caps hover:bg-white hover:text-background transition-colors duration-300 shadow-[0_0_20px_rgba(173,198,255,0.4)]">
              Initialize Contact Sequence
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest text-tertiary font-label-caps text-label-caps full-width py-12 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center px-20 w-full gap-8 relative z-10">
        <div className="font-headline-md text-headline-md text-primary">
          TBL ARCHITECT
        </div>
        <div>
          © 2024 Trịnh Bảo Long. Neural Systems Architect.
        </div>
        <div className="flex gap-6">
          <a className="text-outline hover:text-secondary transition-colors" href="#">Github</a>
          <a className="text-outline hover:text-secondary transition-colors" href="#">LinkedIn</a>
          <a className="text-outline hover:text-secondary transition-colors" href="#">Source</a>
          <a className="text-outline hover:text-secondary transition-colors" href="#">Email</a>
        </div>
      </footer>
    </>
  )
}

export default App
