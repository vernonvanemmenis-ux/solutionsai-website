# SolutionsAI scroll-bg reel — storyboard v2 (3D fantasy)

Theme: **Evolution of business process automation**, told as a continuous flythrough of four floating sky-islands at golden hour. Each island = one era of BPA. Cinematic 3D fantasy render — same aesthetic family as aiautomationsociety.ai's hero reel.

## Universal constraints
- **Aspect ratio:** 16:9
- **Resolution:** 1080p (Veo 3 Fast)
- **Duration:** 5 s each
- **Camera:** slow horizontal dolly + slight forward push, gentle parallax, no cuts
- **Style cues:** "Unreal Engine 5, cinematic 3D render, photoreal CGI, fantasy concept art, anamorphic lens, depth of field, volumetric god rays"
- **Sky:** continuous golden-hour to dusk gradient — orange/peach near horizon, deep cobalt above. Same sky across all 4 scenes for cohesion.
- **Cloud bed:** soft cumulus/cirrus drifting, layered for parallax. Same in all 4.
- **Connecting motif:** glowing **cyan-blue light trails / data ribbons** flowing from island edge to island edge — represent automation handoff.
- **Lighting key:** every island has a warm key light (lantern / CRT glow / monitor / hologram) AND cool cyan rim light. Cyan = the brand thread.
- **No people, no text, no UI overlays, no logos.**
- **Composition:** the focal island sits centre-right; left side reveals previous island in distance; right side hints at next island fading into clouds.

## Scene 1 — Paper ledger island (Victorian / pre-industrial)
> Cinematic 3D fantasy render, Unreal Engine 5 style, photoreal. A floating sky-island at golden hour: weathered stone slab covered in moss and tufted grass, drifting in a vast cloud sea. Centred on the island is a heavy wooden Victorian-era writing desk with leather-bound ledgers stacked open, ink quills, a brass oil lamp glowing warmly, a brass abacus, scattered loose papers held down by an iron paperweight. Warm amber lantern light pools across the desk; cool cyan rim light from a glowing portal-stone at the island's edge. Glowing cyan-blue data ribbons trail off the right edge of the island, flowing toward a distant second island barely visible in the clouds. Slow horizontal dolly with a gentle forward push. Anamorphic lens flares, soft volumetric god rays, deep depth of field, dusk sky. 16:9.

## Scene 2 — 80s/90s computer island (electronic era)
> Cinematic 3D fantasy render, Unreal Engine 5 style, photoreal. A floating sky-island at golden hour, smaller and more industrial than the previous one: a metal-grate platform riveted onto a stone chunk, with cables draped over the edges. Centred on it is a beige early-90s desktop computer setup — boxy CRT monitor displaying glowing green phosphor text, mechanical keyboard, a dot-matrix printer with continuous-feed paper trailing off the platform's edge, and a desk lamp casting amber light. The CRT bathes the foreground in a cool green-blue glow. Glowing cyan-blue data ribbons enter from the left (from the ledger island) and exit right toward a distant third island. Slow horizontal dolly. Anamorphic lens, volumetric haze, depth of field, dusk sky. 16:9.

## Scene 3 — Cloud SaaS island (modern dashboards era)
> Cinematic 3D fantasy render, Unreal Engine 5 style, photoreal. A floating sky-island at golden hour, larger, with sleek modern architecture: a polished obsidian platform with subtle glowing edge runes, holding a minimalist white desk. Floating above the desk are several semi-translucent glass dashboard panels — bar charts, line graphs, pie charts — all rendered in cool cyan-blue tones, drifting at slight angles. A pair of slender chrome floor-lamps cast soft warm fill light. Glowing cyan-blue data ribbons stream in from the left and arc out the right edge toward a fourth, larger island in the distance. Slow horizontal dolly with mild forward push. Anamorphic lens flares, volumetric atmosphere, deep depth of field, late-golden-hour sky. 16:9.

## Scene 4 — AI agent island (autonomous era)
> Cinematic 3D fantasy render, Unreal Engine 5 style, photoreal. The largest, most futuristic floating sky-island at dusk turning to night: a curved obsidian platform with concentric glowing cyan rings inlaid into its surface. At the centre rises a tall holographic spire emitting cyan-blue voice-waveform ribbons that swirl outward, plus several floating holographic agent avatars — semi-translucent humanoid silhouettes formed from glowing data points. The sky is deeper cobalt with the last glow of sunset. Glowing cyan-blue data ribbons converge into the island from the left (from the SaaS island). The whole scene pulses with soft volumetric cyan haze. Slow horizontal dolly, slight downward tilt to reveal the curved island's full size. Anamorphic lens flares, deep volumetric god rays, photoreal CGI. 16:9.

## Output expectations
- 4 × MP4, ~5 s each, 1920×1080, 24 fps
- ffmpeg cross-fade 1 s between adjacent pairs → ~17 s master clip
- Extract every other frame as JPG at 1280×720, q:v 6 → ~200 frames into `assets/bg-frames/`
- Target payload: 12–18 MB total
