import { useRef, useEffect } from "react";
import Hammer from 'hammerjs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { PlayButton } from '@videojs/react'
import { Video, VideoPlayer, VideoSkin, usePlayer } from '@videojs/react/video'
import '@videojs/react/video/skin.css'

import { getHigherPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { classNames } from "../utils/class-names";

const isLoopType = (media) => {
  // contoh: video pendek dianggap loop
  return media.duration > 0 && media.duration < 30
}

const VideoPlaybackSync = ({ dispatch }) => {
  const paused = usePlayer((state) => state.paused)

  useEffect(() => {
    dispatch({ type: paused ? 'pause' : 'play' })
  }, [paused])

  return null
}

const VideoGestureOverlay = ({ dispatch }) => {
  const overlay = useRef<HTMLDivElement>(null)
  const playback = usePlayer((state) => ({ paused: state.paused, play: state.play }))
  const paused = playback?.paused ?? true
  const current = useRef({ dispatch, play: playback?.play, paused })
  current.current = { dispatch, play: playback?.play, paused }

  useEffect(() => {
    const el = overlay.current
    if (!el) {
      return
    }

    const onSwipeHandler = (ev) => {
      const { dispatch, paused } = current.current
      if (!paused) {
        return
      }
      ev.preventDefault()

      if (ev.direction === Hammer.DIRECTION_LEFT) {
        dispatch({ type: 'next' })
      } else if (ev.direction === Hammer.DIRECTION_RIGHT) {
        dispatch({ type: 'prev' })
      } else if (ev.direction === Hammer.DIRECTION_DOWN || ev.direction === Hammer.DIRECTION_UP) {
        dispatch({ type: 'list' })
      }
    }

    const onTapHandler = (ev) => {
      if (!current.current.paused) {
        return
      }
      ev.preventDefault()
      current.current.play?.()
    }

    const mc = new Hammer.Manager(el)
    mc.add(new Hammer.Swipe())
    mc.add(new Hammer.Tap());

    mc.on("swipe", onSwipeHandler)
    mc.on("tap", onTapHandler)

    return () => {
      mc.stop(false)
      mc.destroy()
    }
  }, [])

  return (
    <div ref={overlay} className={classNames('absolute top-0 left-0 right-0 bottom-14 md:bottom-18', { 'hidden': !paused })}></div>
  )
}

const BigPlayButton = () => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <PlayButton
        className="pointer-events-auto flex items-center justify-center w-20 h-20 rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 hover:opacity-100 hover:bg-black/70 data-[paused]:opacity-100"
        render={(props, state) => (
          <button {...props}>
            <FontAwesomeIcon
              icon={(state.paused || state.ended) ? icons.faPlay : icons.faPause}
              className="text-3xl"
            />
          </button>
        )}
      />
    </div>
  )
}

export const MediaViewVideo = (props) => {
  const { media, dispatch } = props
  const { previews } = media;
  const previewSize = usePreviewSize()
  const posterUrl = getHigherPreviewUrl(previews, previewSize) || ''

  const videoPreview = previews.filter(p => p.match(/video-preview/)).shift()
  const videoUrl = videoPreview ? `files/${videoPreview}` : ''
  const videoMime = videoPreview ? `video/${videoPreview.substring(videoPreview.lastIndexOf('.') + 1).toLowerCase()}` : 'video/mp4'
  const shouldLoop = isLoopType(media)

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <VideoPlayer poster={posterUrl}>
          <VideoSkin className="w-full h-full">
            <Video playsInline loop={shouldLoop} muted={shouldLoop} className="w-full h-full">
              <source src={videoUrl} type={videoMime} />
              No native video element support. Watch video file from <a href={videoUrl}>here</a>
            </Video>
          </VideoSkin>
          <VideoPlaybackSync dispatch={dispatch} />
          <VideoGestureOverlay dispatch={dispatch} />
          <BigPlayButton />
        </VideoPlayer>
      </div>
    </>
  )
}
