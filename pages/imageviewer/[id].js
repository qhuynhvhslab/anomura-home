import React, { useEffect, useState } from "react";
import s from "/sass/imageviewer/imageviewer.module.css";
import { useRouter } from "next/router";
import {
    getBody,
    getClaws,
    getShell,
    getLegs,
    getBackground,
    getHeadPieces,
} from "scripts/crabData";

import { CrabViewModal } from "/containers/imageviewer/ContainerIndex";
import Enums from "enums";
import useSWR from "swr";

import {
    bodyPartsData,
    habitatPartsData,
    clawsPartsData,
    shellPartsData,
    servicePartsData,
    headpiecesPartsData,
    legsPartsData
} from "resources/cloudinary";
// import { getAllCrabs, getAnomuraById, getFirst1000Anomuras } from "repositories/crabs";

import { PrismaClient } from '@prisma/client'

/** static props and paths should not call to api link since it is not available on build time */
export const getStaticPaths = async () => {
    const prisma = new PrismaClient()
    let data = await prisma.anomuras.findMany({
        take: 500
    });
    await prisma.$disconnect();

    const paths = data.map((p) => {
        return {
            params: { id: p.crabId.toString() },
        };
    });

    return {
        paths,
        fallback: "blocking", // true
    };
};

export const getStaticProps = async (context) => {
    const crabId = parseInt(context.params.id);

    const prisma = new PrismaClient()
    const data = await prisma.anomuras.findUnique({
        where: {
            crabId: parseInt(crabId),
        }
    })
    await prisma.$disconnect();
    return {
        props: { data: JSON.parse(JSON.stringify(data)), key: crabId },
        revalidate: 86400 * 7,
    };
};

const buildArrayImages = (name, source) => {
    let images = [];

    for (let i = 0; i <= 23; i++) {
        let imagePart = source[name][i];
        images.push(imagePart);
    }
    return images;
};
const fetcher = (url) => fetch(url).then((r) => r.json());

/* order of layers to work: background, shadow, shells, headpieces, legs, body, claws */
function AnimateViewerDetails({ data }) {
    const router = useRouter();
    let sources = {
        background: {},
        shell: {},
        legs: {},
        body: {},
        claws: {},
        headpieces: {},
        shadow: {},
    };

    // const { id } = router.query;
    // const { data, mutate, isValidating, error } = useSWR(
    //     id ? `/api/crabs/getAnomuraById?id=${id}` : null,
    //     fetcher
    // );

    if (router.isFallback || !data) {
        return <div>Loading Anomura...</div>;
    } else {
        try {
            if (!data) {
                return <div className={s.loading}>Loading Anomura...</div>;
            }
            const { background, body, claws, legs, shell, headpieces, anomuraEquipments } = data;
            let isDrawHeadpieces = false;
            let shouldHaveEquipment = false;
            if (anomuraEquipments?.length > 0 && shouldHaveEquipment) {
                // check if we should render the claws equipped instead of of anomura original claw
                let clawsEquipmentIndex = anomuraEquipments.findIndex((eq) => eq.type === Enums.CLAWS);
                if (clawsEquipmentIndex != -1) {
                    sources.claws =
                        sources.claws + getClaws(anomuraEquipments[clawsEquipmentIndex].name);
                } else {
                    sources.claws = sources.claws + getClaws(claws);
                }
                // check if we should render the legs equipped instead of of anomura original legs
                let legsEquipmentIndex = anomuraEquipments.findIndex((eq) => eq.type === Enums.LEGS);
                if (legsEquipmentIndex != -1) {
                    sources.legs = sources.legs + getLegs(anomuraEquipments[legsEquipmentIndex].name);
                } else {
                    sources.legs = sources.legs + getLegs(legs);
                }
                // check if we should render the shell equipped instead of of anomura original shell
                let shellEquipmentIndex = anomuraEquipments.findIndex((eq) => eq.type === Enums.SHELL);
                if (shellEquipmentIndex != -1) {
                    sources.shell =
                        sources.claws + getShell(anomuraEquipments[shellEquipmentIndex].name);
                } else {
                    sources.shell = sources.shell + getShell(shell);
                }
                // check if we should render the body equipped instead of of anomura original body
                let bodyEquipmentIndex = anomuraEquipments.findIndex((eq) => eq.type === Enums.BODY);
                if (bodyEquipmentIndex != -1) {
                    sources.body = sources.body + getBody(anomuraEquipments[bodyEquipmentIndex].name);
                } else {
                    sources.body = sources.body + getBody(body);
                }
                // check if we should render the body equipped instead of of anomura original body
                let headpiecesEquipmentIndex = anomuraEquipments.findIndex(
                    (eq) => eq.type === Enums.HEADPIECES
                );
                if (headpiecesEquipmentIndex != -1) {
                    sources.headpieces =
                        sources.headpieces +
                        getHeadPieces(anomuraEquipments[headpiecesEquipmentIndex].name);
                    isDrawHeadpieces = true;
                } else {
                    sources.headpieces = sources.headpieces + getHeadPieces(headpieces);
                    isDrawHeadpieces = headpieces.toString().trim() !== "";
                }
            }
            //no equipment
            else {

                if (headpieces && headpieces?.toString().trim() !== "None") {
                    isDrawHeadpieces = true;
                }

                // sources.claws = sources.claws + getClaws(claws);
                // sources.legs = sources.legs + getLegs(legs);
                // sources.shell = sources.shell + getShell(shell);
                // sources.headpieces = sources.headpieces + getHeadPieces(headpieces);
                if (isDrawHeadpieces) {
                    sources.headpieces = buildArrayImages(getHeadPieces(headpieces), headpiecesPartsData);
                }
                sources.claws = buildArrayImages(getClaws(claws), clawsPartsData);
                sources.body = buildArrayImages(getBody(body), bodyPartsData);
                sources.shell = buildArrayImages(getShell(shell), shellPartsData);
                sources.legs = buildArrayImages(getLegs(legs), legsPartsData);
                sources.shadow = buildArrayImages("shadow", servicePartsData);
            }
            // sources.background = sources.background + getBackground(background);
            sources.background = buildArrayImages(getBackground(background), habitatPartsData);

            return <CrabCanvas sources={sources} data={data} isDrawHeadpieces={isDrawHeadpieces} />;
        } catch (error) {
            console.log(error)
        }

    }
}

export default AnimateViewerDetails;

const CrabCanvas = ({ sources, data, isDrawHeadpieces }) => {
    const [imagesSrc, setImageSrc] = React.useState({});
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, clientHeight: 0 });

    const canvasRef = React.createRef(null);
    let canvas = null;
    let context = null;

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                if (
                    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                        navigator.userAgent
                    ) ||
                    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                        navigator.userAgent.substr(0, 4)
                    )
                ) {
                    // setIsMobile(true);
                    setCanvasSize((prevState) => ({
                        ...prevState,
                        width: window?.innerWidth,
                        height: window?.innerWidth,
                    }));
                } else {
                    // setIsMobile(false);
                    setCanvasSize((prevState) => ({
                        ...prevState,
                        width: 508,
                        height: 500,
                    }));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    useEffect(() => {
        if (canvasRef && isLoaded == false) {
            LoadImages(sources).done((images) => {

                setImageSrc(images);
                setIsLoaded(true);
            });
        }

        if (isLoaded == true) {
            canvas = canvasRef?.current;
            context = canvas?.getContext("2d");
            DrawImagesOnCanvas(imagesSrc);
        }
    }, [imagesSrc]);

    const DrawImagesOnCanvas = (images) => {
        canvas = canvasRef?.current;
        context = canvas?.getContext("2d");
        let width = canvasSize.width; // 508
        let height = canvasSize.height; // 508
        let counter = 0;

        setInterval(() => {
            if (counter == 24) counter = 0;
            context.drawImage(images.background[counter], 0, 0, width, height);
            context.drawImage(images.shadow[counter], 0, 0, width, height);
            context.drawImage(images.shell[counter], 0, 0, width, height);
            isDrawHeadpieces && context.drawImage(images.headpieces[counter], 0, 0, width, height);
            context.drawImage(images.legs[counter], 0, 0, width, height);
            context.drawImage(images.body[counter], 0, 0, width, height);
            context.drawImage(images.claws[counter], 0, 0, width, height);

            counter++;
        }, 150);
    };

    const LoadImages = (sources, onFinished) => {
        let imageLoaded = 0,
            i = 0,
            numImages = 0;

        const images = {
            background: [],
            shell: [],
            legs: [],
            body: [],
            claws: [],
            headpieces: [],
            shadow: [],
        };
        var postaction = function () { };

        // 24 frames per part, we have 7 parts ~ 24 * 7 = 168
        function onFinished() {
            if (imageLoaded == 144 && isDrawHeadpieces == false) {
                postaction(images);
            }
            if (imageLoaded == 168) {
                postaction(images);
            }
        }
        for (var src in sources) {
            numImages++;
        }
        for (var src in sources) {
            if (src == "headpieces" && isDrawHeadpieces === false) {
                continue;
            }

            for (let index = 0; index <= 23; index++) {
                images[src][index] = new Image();
                images[src][index].onload = function () {
                    if (++imageLoaded >= numImages) {
                        onFinished(images);
                    }
                };

                images[src][index].src = sources[src][index];
            }
        }

        return {
            done: function (f) {
                postaction = f || postaction;
            },
        };
    };

    return (
        <div style={{
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "-1",
            width: "100vw",
            height: "100vh",
            padding: "0",
            margin: "0"
        }}>
            <div className={s.container} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: canvasSize.width, height: canvasSize.height, position: "relative" }}>
                    <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />
                    <div className={s.toggleModal_wrapper} onClick={() => setModalOpen(!modalOpen)}>
                        <div className={s.toggleModal_container}>
                            <img src="/img/imageviewer/Others/OpenSea Invetory_icons_05.png" />
                            <img src="/img/imageviewer/Others/Inventory Button Outline.png" />
                        </div>
                    </div>
                    {modalOpen && <CrabViewModal data={data} setModalOpen={setModalOpen} />}
                </div>
            </div>
        </div>
    );
};
