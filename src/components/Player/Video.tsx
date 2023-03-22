import { useRootStore } from "@/context/root-context";
import Artplayer from "artplayer";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import ErrorView from "../ErrorView";
import LoadingBox from "../LoadingBox";
import Hls from 'hls.js'
import clsx from "clsx";
import { historyDB } from "@/db";

interface VideoPlayerProps {
    pkg: string;
    url: string;
    chapter: string;
    title: string;
    pageUrl: string;
    className?: string;
}

export default function VideoPlayer(props: VideoPlayerProps) {

    const { extensionStore } = useRootStore()

    const extension = extensionStore.getExtension(props.pkg)

    const artRef = useRef(null);


    const { data, error, isLoading } = useQuery(`getVideoPlayer${props.pkg}${props.url}`, () => {
        return extension?.watch(props.url)
    })


    useEffect(() => {
        if (!artRef || !data) {
            return
        }
        console.log(data);

        const art = new Artplayer({
            container: artRef.current as unknown as HTMLDivElement,
            url: data.url,
            type: data.type,
            pip: true,
            autoMini: true,
            screenshot: true,
            setting: true,
            flip: true,
            lock: true,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: true,
            subtitleOffset: true,
            miniProgressBar: true,
            mutex: true,
            backdrop: true,
            playsInline: true,
            lang: navigator.language.toLowerCase(),
            autoPlayback: true,
            airplay: true,
            moreVideoAttr: {
                crossOrigin: 'anonymous',
            },
            settings: [
                {
                    width: 200,
                    html: '字幕',
                    selector: [
                        {
                            html: 'Display',
                            tooltip: 'Show',
                            switch: true,
                            onSwitch: function (item) {
                                item.tooltip = item.switch ? 'Hide' : 'Show';
                                art.subtitle.show = !item.switch;
                                return !item.switch;
                            },
                        },
                        {
                            default: false,
                            html: '选择字幕文件',
                        },
                    ],
                    onSelect: function (item) {
                        if (item.html === '选择字幕文件') {
                            // 选择字幕文件
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'text/srt';
                            input.click();
                            input.onchange = function () {
                                if (!input.files) {
                                    return
                                }
                                const file = input.files[0];
                                if (file) {
                                    item.url = URL.createObjectURL(file)
                                    art.subtitle.switch(item.url, {
                                        name: file.name,
                                    });
                                }
                            }
                            return item.html;
                        }

                        art.subtitle.switch(item.url, {
                            name: item.html,
                        });
                        return item.html;
                    },
                }
            ],
            subtitle: {
                type: 'srt',
                style: {
                    color: '#000',
                    fontSize: '20px',
                    textShadow: '0 1px white, 1px 0 white, -1px 0 white, 0 -1px white',
                },
                encoding: 'utf-8',
            },
            customType: {
                hls: playM3u8,
            },
        });
        art.on('ready', () => {
            art.autoHeight = true;
        });
        art.on('resize', () => {
            art.autoHeight = true;
        });
        art.on("destroy", async () => {
            const data = await (fetch(await art.getBlobUrl()))
            const cover = await data.arrayBuffer()
            // 存储历史记录
            historyDB.addHistory({
                package: props.pkg,
                url: props.pageUrl,
                title: props.title,
                chapter: props.chapter,
                type: "bangumi",
                cover: cover,
            })

        })
        return () => {
            if (art && art.destroy) {
                art.destroy(false);
            }
        };
    }, [data]);


    if (error) {
        return <ErrorView error={error}></ErrorView>
    }

    if (isLoading) {
        return <LoadingBox />
    }

    if (!data) {
        return (
            <ErrorView error={"地址获取失败"} />
        )
    }


    return <div ref={artRef} className={clsx("max-h-screen h-36", props.className)}></div>;
}


function playM3u8(video: HTMLMediaElement, url: string, art: Artplayer) {
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
    } else {
        art.notice.show = 'Unsupported playback format: m3u8';
    }
}