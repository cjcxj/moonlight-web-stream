import { ControllerConfig } from "../stream/gamepad.js";
import { MouseScrollMode } from "../stream/input.js";
import { PageStyle } from "../styles/index.js";
import { Component, ComponentEvent } from "./index.js";
import { InputComponent, SelectComponent } from "./input.js";
import { SidebarEdge } from "./sidebar/index.js";
import { Language, getLanguage, setLanguage, t } from "../i18n.js";

export type Settings = {
    sidebarEdge: SidebarEdge,
    bitrate: number
    packetSize: number
    videoFrameQueueSize: number
    videoSize: "720p" | "1080p" | "1440p" | "4k" | "native" | "custom"
    videoSizeCustom: {
        width: number
        height: number
    },
    fps: number
    videoCodec: StreamCodec,
    forceVideoElementRenderer: boolean
    canvasRenderer: boolean
    canvasVsync: boolean
    playAudioLocal: boolean
    audioSampleQueueSize: number
    mouseScrollMode: MouseScrollMode
    controllerConfig: ControllerConfig
    dataTransport: TransportType
    toggleFullscreenWithKeybind: boolean
    pageStyle: PageStyle
    hdr: boolean
    useSelectElementPolyfill: boolean
    language: Language
}

export type StreamCodec = "h264" | "auto" | "h265" | "av1"
export type TransportType = "auto" | "webrtc" | "websocket"

import DEFAULT_SETTINGS from "../default_settings.js"

export function defaultSettings(): Settings {
    // We are deep cloning this
    const settings: Settings = ("structuredClone" in window) ?
        structuredClone(DEFAULT_SETTINGS) as any :
        JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

    settings.language = getLanguage()
    return settings
}

export function getLocalStreamSettings(): Settings | null {
    let settings = null
    try {
        const settingsLoadedJson = localStorage.getItem("mlSettings")
        if (settingsLoadedJson == null) {
            return null
        }

        const settingsLoaded = JSON.parse(settingsLoadedJson)

        settings = defaultSettings()
        Object.assign(settings, settingsLoaded)
    } catch (e) {
        localStorage.removeItem("mlSettings")
    }

    // Migration
    if (settings?.pageStyle == "old") {
        settings.pageStyle = "moonlight"
    }

    return settings
}
export function setLocalStreamSettings(settings?: Settings) {
    localStorage.setItem("mlSettings", JSON.stringify(settings))
}

export type StreamSettingsChangeListener = (event: ComponentEvent<StreamSettingsComponent>) => void

export class StreamSettingsComponent implements Component {

    private divElement: HTMLDivElement = document.createElement("div")

    private sidebarHeader: HTMLHeadingElement = document.createElement("h2")
    private sidebarEdge: SelectComponent

    private streamHeader: HTMLHeadingElement = document.createElement("h2")
    private bitrate: InputComponent
    private packetSize: InputComponent
    private fps: InputComponent
    private videoCodec: SelectComponent
    private forceVideoElementRenderer: InputComponent
    private canvasRenderer: InputComponent
    private canvasVsync: InputComponent
    private hdr: InputComponent

    private videoSize: SelectComponent
    private videoSizeWidth: InputComponent
    private videoSizeHeight: InputComponent

    private videoSampleQueueSize: InputComponent

    private audioHeader: HTMLHeadingElement = document.createElement("h2")
    private playAudioLocal: InputComponent
    private audioSampleQueueSize: InputComponent

    private mouseHeader: HTMLHeadingElement = document.createElement("h2")
    private mouseScrollMode: SelectComponent

    private controllerHeader: HTMLHeadingElement = document.createElement("h2")
    private controllerInvertAB: InputComponent
    private controllerInvertXY: InputComponent
    private controllerSendIntervalOverride: InputComponent

    private otherHeader: HTMLHeadingElement = document.createElement("h2")
    private language: SelectComponent
    private dataTransport: SelectComponent
    private toggleFullscreenWithKeybind: InputComponent

    private pageStyle: SelectComponent

    private useSelectElementPolyfill: InputComponent

    constructor(settings?: Settings) {
        const defaultSettings_ = defaultSettings()

        // Root div
        this.divElement.classList.add("settings")

        // Sidebar
        this.sidebarHeader.innerText = t("sidebar")
        this.divElement.appendChild(this.sidebarHeader)

        this.sidebarEdge = new SelectComponent("sidebarEdge", [
            { value: "left", name: t("left") },
            { value: "right", name: t("right") },
            { value: "up", name: t("up") },
            { value: "down", name: t("down") },
        ], {
            displayName: t("sidebar_edge"),
            preSelectedOption: settings?.sidebarEdge ?? defaultSettings_.sidebarEdge,
        })
        this.sidebarEdge.addChangeListener(this.onSettingsChange.bind(this))
        this.sidebarEdge.mount(this.divElement)

        // Video
        this.streamHeader.innerText = t("video")
        this.divElement.appendChild(this.streamHeader)

        // Bitrate
        this.bitrate = new InputComponent("bitrate", "number", t("bitrate"), {
            defaultValue: defaultSettings_.bitrate.toString(),
            value: settings?.bitrate?.toString(),
            step: "100",
            numberSlider: {
                range_min: 1000,
                range_max: 10000,
            }
        })
        this.bitrate.addChangeListener(this.onSettingsChange.bind(this))
        this.bitrate.mount(this.divElement)

        // Packet Size
        this.packetSize = new InputComponent("packetSize", "number", t("packet_size"), {
            defaultValue: defaultSettings_.packetSize.toString(),
            value: settings?.packetSize?.toString(),
            step: "100"
        })
        this.packetSize.addChangeListener(this.onSettingsChange.bind(this))
        this.packetSize.mount(this.divElement)

        // Fps
        this.fps = new InputComponent("fps", "number", t("fps"), {
            defaultValue: defaultSettings_.fps.toString(),
            value: settings?.fps?.toString(),
            step: "100"
        })
        this.fps.addChangeListener(this.onSettingsChange.bind(this))
        this.fps.mount(this.divElement)

        // Video Size
        this.videoSize = new SelectComponent("videoSize",
            [
                { value: "720p", name: "720p" },
                { value: "1080p", name: "1080p" },
                { value: "1440p", name: "1440p" },
                { value: "4k", name: "4k" },
                { value: "native", name: "native" },
                { value: "custom", name: "custom" }
            ],
            {
                displayName: t("video_size"),
                preSelectedOption: settings?.videoSize || defaultSettings_.videoSize
            }
        )
        this.videoSize.addChangeListener(this.onSettingsChange.bind(this))
        this.videoSize.mount(this.divElement)

        this.videoSizeWidth = new InputComponent("videoSizeWidth", "number", t("video_width"), {
            defaultValue: defaultSettings_.videoSizeCustom.width.toString(),
            value: settings?.videoSizeCustom.width.toString()
        })
        this.videoSizeWidth.addChangeListener(this.onSettingsChange.bind(this))
        this.videoSizeWidth.mount(this.divElement)

        this.videoSizeHeight = new InputComponent("videoSizeHeight", "number", t("video_height"), {
            defaultValue: defaultSettings_.videoSizeCustom.height.toString(),
            value: settings?.videoSizeCustom.height.toString()
        })
        this.videoSizeHeight.addChangeListener(this.onSettingsChange.bind(this))
        this.videoSizeHeight.mount(this.divElement)

        // Video Sample Queue Size
        this.videoSampleQueueSize = new InputComponent("videoFrameQueueSize", "number", t("video_frame_queue_size"), {
            defaultValue: defaultSettings_.videoFrameQueueSize.toString(),
            value: settings?.videoFrameQueueSize?.toString()
        })
        this.videoSampleQueueSize.addChangeListener(this.onSettingsChange.bind(this))
        this.videoSampleQueueSize.mount(this.divElement)

        // Codec
        this.videoCodec = new SelectComponent("videoCodec", [
            { value: "h264", name: t("h264") },
            { value: "auto", name: t("auto_experimental") },
            { value: "h265", name: t("h265") },
            { value: "av1", name: t("av1_experimental") },
        ], {
            displayName: t("video_codec"),
            preSelectedOption: settings?.videoCodec ?? defaultSettings_.videoCodec
        })
        this.videoCodec.addChangeListener(this.onSettingsChange.bind(this))
        this.videoCodec.mount(this.divElement)

        // Force Video Element renderer
        this.forceVideoElementRenderer = new InputComponent("forceVideoElementRenderer", "checkbox", t("force_video_element_renderer"), {
            checked: settings?.forceVideoElementRenderer ?? defaultSettings_.forceVideoElementRenderer
        })
        this.forceVideoElementRenderer.addChangeListener(this.onSettingsChange.bind(this))
        this.forceVideoElementRenderer.mount(this.divElement)

        // Use Canvas Renderer
        this.canvasRenderer = new InputComponent("canvasRenderer", "checkbox", t("use_canvas_renderer"), {
            defaultValue: defaultSettings_.canvasRenderer.toString(),
            checked: settings === null || settings === void 0 ? void 0 : settings.canvasRenderer
        })
        this.canvasRenderer.addChangeListener(this.onSettingsChange.bind(this))
        this.canvasRenderer.mount(this.divElement)

        // Canvas VSync (Canvas only: sync draw to display refresh to reduce tearing; off = lower latency)
        this.canvasVsync = new InputComponent("canvasVsync", "checkbox", t("canvas_vsync"), {
            checked: settings?.canvasVsync ?? defaultSettings_.canvasVsync
        })
        this.canvasVsync.addChangeListener(this.onSettingsChange.bind(this))
        this.canvasVsync.mount(this.divElement)

        // HDR
        this.hdr = new InputComponent("hdr", "checkbox", t("enable_hdr"), {
            checked: settings?.hdr ?? defaultSettings_.hdr
        })
        this.hdr.addChangeListener(this.onSettingsChange.bind(this))
        this.hdr.mount(this.divElement)

        // Audio local
        this.audioHeader.innerText = t("audio")
        this.divElement.appendChild(this.audioHeader)

        this.playAudioLocal = new InputComponent("playAudioLocal", "checkbox", t("play_audio_local"), {
            checked: settings?.playAudioLocal
        })
        this.playAudioLocal.addChangeListener(this.onSettingsChange.bind(this))
        this.playAudioLocal.mount(this.divElement)

        // Audio Sample Queue Size
        this.audioSampleQueueSize = new InputComponent("audioSampleQueueSize", "number", t("audio_sample_queue_size"), {
            defaultValue: defaultSettings_.audioSampleQueueSize.toString(),
            value: settings?.audioSampleQueueSize?.toString()
        })
        this.audioSampleQueueSize.addChangeListener(this.onSettingsChange.bind(this))
        this.audioSampleQueueSize.mount(this.divElement)

        // Mouse
        this.mouseHeader.innerText = t("mouse")
        this.divElement.appendChild(this.mouseHeader)

        this.mouseScrollMode = new SelectComponent("mouseScrollMode",
            [
                { value: "highres", name: t("high_res") },
                { value: "normal", name: t("normal") }
            ],
            {
                displayName: t("scroll_mode"),
                preSelectedOption: settings?.mouseScrollMode || defaultSettings_.mouseScrollMode
            }
        )
        this.mouseScrollMode.addChangeListener(this.onSettingsChange.bind(this))
        this.mouseScrollMode.mount(this.divElement)

        // Controller
        if (window.isSecureContext) {
            this.controllerHeader.innerText = t("controller")
        } else {
            this.controllerHeader.innerText = t("controller_disabled_secure_context")
        }
        this.divElement.appendChild(this.controllerHeader)

        this.controllerInvertAB = new InputComponent("controllerInvertAB", "checkbox", t("invert_ab"), {
            checked: settings?.controllerConfig.invertAB
        })
        this.controllerInvertAB.addChangeListener(this.onSettingsChange.bind(this))
        this.controllerInvertAB.mount(this.divElement)

        this.controllerInvertXY = new InputComponent("controllerInvertXY", "checkbox", t("invert_xy"), {
            checked: settings?.controllerConfig.invertXY
        })
        this.controllerInvertXY.addChangeListener(this.onSettingsChange.bind(this))
        this.controllerInvertXY.mount(this.divElement)

        // Controller Send Interval
        this.controllerSendIntervalOverride = new InputComponent("controllerSendIntervalOverride", "number", t("override_controller_interval"), {
            hasEnableCheckbox: true,
            defaultValue: "20",
            value: settings?.controllerConfig.sendIntervalOverride?.toString(),
            numberSlider: {
                range_min: 10,
                range_max: 120
            }
        })
        this.controllerSendIntervalOverride.setEnabled(settings?.controllerConfig.sendIntervalOverride != null)
        this.controllerSendIntervalOverride.addChangeListener(this.onSettingsChange.bind(this))
        this.controllerSendIntervalOverride.mount(this.divElement)

        if (!window.isSecureContext) {
            this.controllerInvertAB.setEnabled(false)
            this.controllerInvertXY.setEnabled(false)
        }

        // Other
        this.otherHeader.innerText = t("other")
        this.divElement.appendChild(this.otherHeader)

        // Language
        this.language = new SelectComponent("language", [
            { value: "en-US", name: "English" },
            { value: "zh-CN", name: "简体中文" },
        ], {
            displayName: "Language / 语言",
            preSelectedOption: getLanguage()
        })
        this.language.addChangeListener(() => {
            const lang = this.language.getValue() as Language
            setLanguage(lang)
            window.location.reload()
        })
        this.language.mount(this.divElement)

        this.dataTransport = new SelectComponent("transport", [
            { value: "auto", name: "Auto" },
            { value: "webrtc", name: t("webrtc") },
            { value: "websocket", name: t("websocket_experimental") },
        ], {
            displayName: t("data_transport"),
            preSelectedOption: settings?.dataTransport ?? defaultSettings_.dataTransport
        })
        this.dataTransport.addChangeListener(this.onSettingsChange.bind(this))
        this.dataTransport.mount(this.divElement)

        this.toggleFullscreenWithKeybind = new InputComponent("toggleFullscreenWithKeybind", "checkbox", "Toggle Fullscreen and Mouse Lock with Ctrl + Shift + I", {
            checked: settings?.toggleFullscreenWithKeybind
        })
        this.toggleFullscreenWithKeybind.addChangeListener(this.onSettingsChange.bind(this))
        this.toggleFullscreenWithKeybind.mount(this.divElement)

        this.pageStyle = new SelectComponent("pageStyle", [
            { value: "standard", name: t("standard") },
            { value: "moonlight", name: t("moonlight") },
            { value: "youthful", name: t("youthful") },
        ], {
            displayName: t("style"),
            preSelectedOption: settings?.pageStyle ?? defaultSettings_.pageStyle
        })
        this.pageStyle.addChangeListener(this.onSettingsChange.bind(this))
        this.pageStyle.mount(this.divElement)

        this.useSelectElementPolyfill = new InputComponent("useSelectElementPolyfill", "checkbox", t("use_custom_dropdown"), {
            checked: settings?.useSelectElementPolyfill ?? defaultSettings_.useSelectElementPolyfill
        })
        this.useSelectElementPolyfill.addChangeListener(this.onSettingsChange.bind(this))
        this.useSelectElementPolyfill.mount(this.divElement)

        this.onSettingsChange()
    }

    private onSettingsChange() {
        if (this.videoSize.getValue() == "custom") {
            this.videoSizeWidth.setEnabled(true)
            this.videoSizeHeight.setEnabled(true)
        } else {
            this.videoSizeWidth.setEnabled(false)
            this.videoSizeHeight.setEnabled(false)
        }

        this.divElement.dispatchEvent(new ComponentEvent("ml-settingschange", this))
    }

    addChangeListener(listener: StreamSettingsChangeListener) {
        this.divElement.addEventListener("ml-settingschange", listener as any)
    }
    removeChangeListener(listener: StreamSettingsChangeListener) {
        this.divElement.removeEventListener("ml-settingschange", listener as any)
    }

    getStreamSettings(): Settings {
        const settings = defaultSettings()

        settings.sidebarEdge = this.sidebarEdge.getValue() as any
        settings.bitrate = parseInt(this.bitrate.getValue())
        settings.packetSize = parseInt(this.packetSize.getValue())
        settings.fps = parseInt(this.fps.getValue())
        settings.videoSize = this.videoSize.getValue() as any
        settings.videoSizeCustom = {
            width: parseInt(this.videoSizeWidth.getValue()),
            height: parseInt(this.videoSizeHeight.getValue())
        }
        settings.videoFrameQueueSize = parseInt(this.videoSampleQueueSize.getValue())
        settings.videoCodec = this.videoCodec.getValue() as any
        settings.forceVideoElementRenderer = this.forceVideoElementRenderer.isChecked()
        settings.canvasRenderer = this.canvasRenderer.isChecked()
        settings.canvasVsync = this.canvasVsync.isChecked()

        settings.playAudioLocal = this.playAudioLocal.isChecked()
        settings.audioSampleQueueSize = parseInt(this.audioSampleQueueSize.getValue())

        settings.mouseScrollMode = this.mouseScrollMode.getValue() as any

        settings.controllerConfig.invertAB = this.controllerInvertAB.isChecked()
        settings.controllerConfig.invertXY = this.controllerInvertXY.isChecked()
        if (this.controllerSendIntervalOverride.isEnabled()) {
            settings.controllerConfig.sendIntervalOverride = parseInt(this.controllerSendIntervalOverride.getValue())
        } else {
            settings.controllerConfig.sendIntervalOverride = null
        }

        settings.dataTransport = this.dataTransport.getValue() as any

        settings.toggleFullscreenWithKeybind = this.toggleFullscreenWithKeybind.isChecked()

        settings.pageStyle = this.pageStyle.getValue() as any

        settings.hdr = this.hdr.isChecked()

        settings.useSelectElementPolyfill = this.useSelectElementPolyfill.isChecked()

        settings.language = this.language.getValue() as Language

        return settings
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.divElement)
    }
    unmount(parent: HTMLElement): void {
        parent.removeChild(this.divElement)
    }
}
