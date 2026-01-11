
import { auth } from './services/firebase';
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Crown, Lock, LayoutGrid, Settings, ChevronLeft, Search,
  Loader2, BrainCircuit, Trophy, Target, 
  Globe, LogOut, ShieldCheck, Mail, Languages, ExternalLink,
  Info
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

import { FootballMatch, Confidence, Language } from './types';
import { MatchCard } from './components/MatchCard';
import { VipSafeCard } from './components/VipSafeCard';
import { ConfidenceIndicator } from './components/ConfidenceIndicator';
import { generatePredictionsAndAnalysis, AnalysisResult } from './services/geminiService';
import { fetchMatchesByDate } from './services/footballApiService';

const ADMIN_CODE = "20202020";
const PAYMENT_LINK = "https://bsbxsvng.mychariow.shop/prd_g3zdgh/checkout";
const VALID_CODES_ARRAY = [ "BETIQ-5",
  "BETIQ-24",
  "BETIQ-55",
  "BETIQ-98",
  "BETIQ-153",
  "BETIQ-220",
  "BETIQ-299",
  "BETIQ-390",
  "BETIQ-493",
  "BETIQ-608",
  "BETIQ-735",
  "BETIQ-874",
  "BETIQ-1025",
  "BETIQ-1188",
  "BETIQ-1363",
  "BETIQ-1550",
  "BETIQ-1749",
  "BETIQ-1960",
  "BETIQ-2183",
  "BETIQ-2418",
  "BETIQ-2665",
  "BETIQ-2924",
  "BETIQ-3195",
  "BETIQ-3478",
  "BETIQ-3773",
  "BETIQ-4080",
  "BETIQ-4399",
  "BETIQ-4730",
  "BETIQ-5073",
  "BETIQ-5428",
  "BETIQ-5795",
  "BETIQ-6174",
  "BETIQ-6565",
  "BETIQ-6968",
  "BETIQ-7383",
  "BETIQ-7810",
  "BETIQ-8249",
  "BETIQ-8700",
  "BETIQ-9163",
  "BETIQ-9638",
  "BETIQ-10125",
  "BETIQ-10624",
  "BETIQ-11135",
  "BETIQ-11658",
  "BETIQ-12193",
  "BETIQ-12740",
  "BETIQ-13299",
  "BETIQ-13870",
  "BETIQ-14453",
  "BETIQ-15048",
  "BETIQ-15655",
  "BETIQ-16274",
  "BETIQ-16905",
  "BETIQ-17548",
  "BETIQ-18203",
  "BETIQ-18870",
  "BETIQ-19549",
  "BETIQ-20240",
  "BETIQ-20943",
  "BETIQ-21658",
  "BETIQ-22385",
  "BETIQ-23124",
  "BETIQ-23875",
  "BETIQ-24638",
  "BETIQ-25413",
  "BETIQ-26200",
  "BETIQ-26999",
  "BETIQ-27810",
  "BETIQ-28633",
  "BETIQ-29468",
  "BETIQ-30315",
  "BETIQ-31174",
  "BETIQ-32045",
  "BETIQ-32928",
  "BETIQ-33823",
  "BETIQ-34730",
  "BETIQ-35649",
  "BETIQ-36580",
  "BETIQ-37523",
  "BETIQ-38478",
  "BETIQ-39445",
  "BETIQ-40424",
  "BETIQ-41415",
  "BETIQ-42418",
  "BETIQ-43433",
  "BETIQ-44460",
  "BETIQ-45499",
  "BETIQ-46550",
  "BETIQ-47613",
  "BETIQ-48688",
  "BETIQ-49775",
  "BETIQ-50874",
  "BETIQ-51985",
  "BETIQ-53108",
  "BETIQ-54243",
  "BETIQ-55390",
  "BETIQ-56549",
  "BETIQ-57720",
  "BETIQ-58903",
  "BETIQ-60098",
  "BETIQ-61305",
  "BETIQ-62524",
  "BETIQ-63755",
  "BETIQ-64998",
  "BETIQ-66253",
  "BETIQ-67520",
  "BETIQ-68799",
  "BETIQ-70090",
  "BETIQ-71393",
  "BETIQ-72708",
  "BETIQ-74035",
  "BETIQ-75374",
  "BETIQ-76725",
  "BETIQ-78088",
  "BETIQ-79463",
  "BETIQ-80850",
  "BETIQ-82249",
  "BETIQ-83660",
  "BETIQ-85083",
  "BETIQ-86518",
  "BETIQ-87965",
  "BETIQ-89424",
  "BETIQ-90895",
  "BETIQ-92378",
  "BETIQ-93873",
  "BETIQ-95380",
  "BETIQ-96899",
  "BETIQ-98430",
  "BETIQ-99973",
  "BETIQ-101528",
  "BETIQ-103095",
  "BETIQ-104674",
  "BETIQ-106265",
  "BETIQ-107868",
  "BETIQ-109483",
  "BETIQ-111110",
  "BETIQ-112749",
  "BETIQ-114400",
  "BETIQ-116063",
  "BETIQ-117738",
  "BETIQ-119425",
  "BETIQ-121124",
  "BETIQ-122835",
  "BETIQ-124558",
  "BETIQ-126293",
  "BETIQ-128040",
  "BETIQ-129799",
  "BETIQ-131570",
  "BETIQ-133353",
  "BETIQ-135148",
  "BETIQ-136955",
  "BETIQ-138774",
  "BETIQ-140605",
  "BETIQ-142448",
  "BETIQ-144303",
  "BETIQ-146170",
  "BETIQ-148049",
  "BETIQ-149940",
  "BETIQ-151843",
  "BETIQ-153758",
  "BETIQ-155685",
  "BETIQ-157624",
  "BETIQ-159575",
  "BETIQ-161538",
  "BETIQ-163513",
  "BETIQ-165500",
  "BETIQ-167499",
  "BETIQ-169510",
  "BETIQ-171533",
  "BETIQ-173568",
  "BETIQ-175615",
  "BETIQ-177674",
  "BETIQ-179745",
  "BETIQ-181828",
  "BETIQ-183923",
  "BETIQ-186030",
  "BETIQ-188149",
  "BETIQ-190280",
  "BETIQ-192423",
  "BETIQ-194578",
  "BETIQ-196745",
  "BETIQ-198924",
  "BETIQ-201115",
  "BETIQ-203318",
  "BETIQ-205533",
  "BETIQ-207760",
  "BETIQ-209999",
  "BETIQ-212250",
  "BETIQ-214513",
  "BETIQ-216788",
  "BETIQ-219075",
  "BETIQ-221374",
  "BETIQ-223685",
  "BETIQ-226008",
  "BETIQ-228343",
  "BETIQ-230690",
  "BETIQ-233049",
  "BETIQ-235420",
  "BETIQ-237803",
  "BETIQ-240198",
  "BETIQ-242605",
  "BETIQ-245024",
  "BETIQ-247455",
  "BETIQ-249898",
  "BETIQ-252353",
  "BETIQ-254820",
  "BETIQ-257299",
  "BETIQ-259790",
  "BETIQ-262293",
  "BETIQ-264808",
  "BETIQ-267335",
  "BETIQ-269874",
  "BETIQ-272425",
  "BETIQ-274988",
  "BETIQ-277563",
  "BETIQ-280150",
  "BETIQ-282749",
  "BETIQ-285360",
  "BETIQ-287983",
  "BETIQ-290618",
  "BETIQ-293265",
  "BETIQ-295924",
  "BETIQ-298595",
  "BETIQ-301278",
  "BETIQ-303973",
  "BETIQ-306680",
  "BETIQ-309399",
  "BETIQ-312130",
  "BETIQ-314873",
  "BETIQ-317628",
  "BETIQ-320395",
  "BETIQ-323174",
  "BETIQ-325965",
  "BETIQ-328768",
  "BETIQ-331583",
  "BETIQ-334410",
  "BETIQ-337249",
  "BETIQ-340100",
  "BETIQ-342963",
  "BETIQ-345838",
  "BETIQ-348725",
  "BETIQ-351624",
  "BETIQ-354535",
  "BETIQ-357458",
  "BETIQ-360393",
  "BETIQ-363340",
  "BETIQ-366299",
  "BETIQ-369270",
  "BETIQ-372253",
  "BETIQ-375248",
  "BETIQ-378255",
  "BETIQ-381274",
  "BETIQ-384305",
  "BETIQ-387348",
  "BETIQ-390403",
  "BETIQ-393470",
  "BETIQ-396549",
  "BETIQ-399640",
  "BETIQ-402743",
  "BETIQ-405858",
  "BETIQ-408985",
  "BETIQ-412124",
  "BETIQ-415275",
  "BETIQ-418438",
  "BETIQ-421613",
  "BETIQ-424800",
  "BETIQ-427999",
  "BETIQ-431210",
  "BETIQ-434433",
  "BETIQ-437668",
  "BETIQ-440915",
  "BETIQ-444174",
  "BETIQ-447445",
  "BETIQ-450728",
  "BETIQ-454023",
  "BETIQ-457330",
  "BETIQ-460649",
  "BETIQ-463980",
  "BETIQ-467323",
  "BETIQ-470678",
  "BETIQ-474045",
  "BETIQ-477424",
  "BETIQ-480815",
  "BETIQ-484218",
  "BETIQ-487633",
  "BETIQ-491060",
  "BETIQ-494499",
  "BETIQ-497950",
  "BETIQ-501413",
  "BETIQ-504888",
  "BETIQ-508375",
  "BETIQ-511874",
  "BETIQ-515385",
  "BETIQ-518908",
  "BETIQ-522443",
  "BETIQ-525990",
  "BETIQ-529549",
  "BETIQ-533120",
  "BETIQ-536703",
  "BETIQ-540298",
  "BETIQ-543905",
  "BETIQ-547524",
  "BETIQ-551155",
  "BETIQ-554798",
  "BETIQ-558453",
  "BETIQ-562120",
  "BETIQ-565799",
  "BETIQ-569490",
  "BETIQ-573193",
  "BETIQ-576908",
  "BETIQ-580635",
  "BETIQ-584374",
  "BETIQ-588125",
  "BETIQ-591888",
  "BETIQ-595663",
  "BETIQ-599450",
  "BETIQ-603249",
  "BETIQ-607060",
  "BETIQ-610883",
  "BETIQ-614718",
  "BETIQ-618565",
  "BETIQ-622424",
  "BETIQ-626295",
  "BETIQ-630178",
  "BETIQ-634073",
  "BETIQ-637980",
  "BETIQ-641899",
  "BETIQ-645830",
  "BETIQ-649773",
  "BETIQ-653728",
  "BETIQ-657695",
  "BETIQ-661674",
  "BETIQ-665665",
  "BETIQ-669668",
  "BETIQ-673683",
  "BETIQ-677710",
  "BETIQ-681749",
  "BETIQ-685800",
  "BETIQ-689863",
  "BETIQ-693938",
  "BETIQ-698025",
  "BETIQ-702124",
  "BETIQ-706235",
  "BETIQ-710358",
  "BETIQ-714493",
  "BETIQ-718640",
  "BETIQ-722799",
  "BETIQ-726970",
  "BETIQ-731153",
  "BETIQ-735348",
  "BETIQ-739555",
  "BETIQ-743774",
  "BETIQ-748005",
  "BETIQ-752248",
  "BETIQ-756503",
  "BETIQ-760770",
  "BETIQ-765049",
  "BETIQ-769340",
  "BETIQ-773643",
  "BETIQ-777958",
  "BETIQ-782285",
  "BETIQ-786624",
  "BETIQ-790975",
  "BETIQ-795338",
  "BETIQ-799713",
  "BETIQ-804100",
  "BETIQ-808499",
  "BETIQ-812910",
  "BETIQ-817333",
  "BETIQ-821768",
  "BETIQ-826215",
  "BETIQ-830674",
  "BETIQ-835145",
  "BETIQ-839628",
  "BETIQ-844123",
  "BETIQ-848630",
  "BETIQ-853149",
  "BETIQ-857680",
  "BETIQ-862223",
  "BETIQ-866778",
  "BETIQ-871345",
  "BETIQ-875924",
  "BETIQ-880515",
  "BETIQ-885118",
  "BETIQ-889733",
  "BETIQ-894360",
  "BETIQ-898999",
  "BETIQ-903650",
  "BETIQ-908313",
  "BETIQ-912988",
  "BETIQ-917675",
  "BETIQ-922374",
  "BETIQ-927085",
  "BETIQ-931808",
  "BETIQ-936543",
  "BETIQ-941290",
  "BETIQ-946049",
  "BETIQ-950820",
  "BETIQ-955603",
  "BETIQ-960398",
  "BETIQ-965205",
  "BETIQ-970024",
  "BETIQ-974855",
  "BETIQ-979698",
  "BETIQ-984553",
  "BETIQ-989420",
  "BETIQ-994299",
  "BETIQ-999190",
  "BETIQ-1004093",
  "BETIQ-1009008",
  "BETIQ-1013935",
  "BETIQ-1018874",
  "BETIQ-1023825",
  "BETIQ-1028788",
  "BETIQ-1033763",
  "BETIQ-1038750",
  "BETIQ-1043749",
  "BETIQ-1048760",
  "BETIQ-1053783",
  "BETIQ-1058818",
  "BETIQ-1063865",
  "BETIQ-1068924",
  "BETIQ-1073995",
  "BETIQ-1079078",
  "BETIQ-1084173",
  "BETIQ-1089280",
  "BETIQ-1094399",
  "BETIQ-1099530",
  "BETIQ-1104673",
  "BETIQ-1109828",
  "BETIQ-1114995",
  "BETIQ-1120174",
  "BETIQ-1125365",
  "BETIQ-1130568",
  "BETIQ-1135783",
  "BETIQ-1141010",
  "BETIQ-1146249",
  "BETIQ-1151500",
  "BETIQ-1156763",
  "BETIQ-1162038",
  "BETIQ-1167325",
  "BETIQ-1172624",
  "BETIQ-1177935",
  "BETIQ-1183258",
  "BETIQ-1188593",
  "BETIQ-1193940",
  "BETIQ-1199299",
  "BETIQ-1204670",
  "BETIQ-1210053",
  "BETIQ-1215448",
  "BETIQ-1220855",
  "BETIQ-1226274",
  "BETIQ-1231705",
  "BETIQ-1237148",
  "BETIQ-1242603",
  "BETIQ-1248070",
  "BETIQ-1253549",
  "BETIQ-1259040",
  "BETIQ-1264543",
  "BETIQ-1270058",
  "BETIQ-1275585",
  "BETIQ-1281124",
  "BETIQ-1286675",
  "BETIQ-1292238",
  "BETIQ-1297813",
  "BETIQ-1303400",
  "BETIQ-1308999",
  "BETIQ-1314610",
  "BETIQ-1320233",
  "BETIQ-1325868",
  "BETIQ-1331515",
  "BETIQ-1337174",
  "BETIQ-1342845",
  "BETIQ-1348528",
  "BETIQ-1354223",
  "BETIQ-1359930",
  "BETIQ-1365649",
  "BETIQ-1371380",
  "BETIQ-1377123",
  "BETIQ-1382878",
  "BETIQ-1388645",
  "BETIQ-1394424",
  "BETIQ-1400215",
  "BETIQ-1406018",
  "BETIQ-1411833",
  "BETIQ-1417660",
  "BETIQ-1423499",
  "BETIQ-1429350",
  "BETIQ-1435213",
  "BETIQ-1441088",
  "BETIQ-1446975",
  "BETIQ-1452874",
  "BETIQ-1458785",
  "BETIQ-1464708",
  "BETIQ-1470643",
  "BETIQ-1476590",
  "BETIQ-1482549",
  "BETIQ-1488520",
  "BETIQ-1494503",
  "BETIQ-1500498",
  "BETIQ-1506505",
  "BETIQ-1512524",
  "BETIQ-1518555",
  "BETIQ-1524598",
  "BETIQ-1530653",
  "BETIQ-1536720",
  "BETIQ-1542799",
  "BETIQ-1548890",
  "BETIQ-1554993",
  "BETIQ-1561108",
  "BETIQ-1567235",
  "BETIQ-1573374",
  "BETIQ-1579525",
  "BETIQ-1585688",
  "BETIQ-1591863",
  "BETIQ-1598050",
  "BETIQ-1604249",
  "BETIQ-1610460",
  "BETIQ-1616683",
  "BETIQ-1622918",
  "BETIQ-1629165",
  "BETIQ-1635424",
  "BETIQ-1641695",
  "BETIQ-1647978",
  "BETIQ-1654273",
  "BETIQ-1660580",
  "BETIQ-1666899",
  "BETIQ-1673230",
  "BETIQ-1679573",
  "BETIQ-1685928",
  "BETIQ-1692295",
  "BETIQ-1698674",
  "BETIQ-1705065",
  "BETIQ-1711468",
  "BETIQ-1717883",
  "BETIQ-1724310",
  "BETIQ-1730749",
  "BETIQ-1737200",
  "BETIQ-1743663",
  "BETIQ-1750138",
  "BETIQ-1756625",
  "BETIQ-1763124",
  "BETIQ-1769635",
  "BETIQ-1776158",
  "BETIQ-1782693",
  "BETIQ-1789240",
  "BETIQ-1795799",
  "BETIQ-1802370",
  "BETIQ-1808953",
  "BETIQ-1815548",
  "BETIQ-1822155",
  "BETIQ-1828774",
  "BETIQ-1835405",
  "BETIQ-1842048",
  "BETIQ-1848703",
  "BETIQ-1855370",
  "BETIQ-1862049",
  "BETIQ-1868740",
  "BETIQ-1875443",
  "BETIQ-1882158",
  "BETIQ-1888885",
  "BETIQ-1895624",
  "BETIQ-1902375",
  "BETIQ-1909138",
  "BETIQ-1915913",
  "BETIQ-1922700",
  "BETIQ-1929499",
  "BETIQ-1936310",
  "BETIQ-1943133",
  "BETIQ-1949968",
  "BETIQ-1956815",
  "BETIQ-1963674",
  "BETIQ-1970545",
  "BETIQ-1977428",
  "BETIQ-1984323",
  "BETIQ-1991230",
  "BETIQ-1998149",
  "BETIQ-2005080",
  "BETIQ-2012023",
  "BETIQ-2018978",
  "BETIQ-2025945",
  "BETIQ-2032924",
  "BETIQ-2039915",
  "BETIQ-2046918",
  "BETIQ-2053933",
  "BETIQ-2060960",
  "BETIQ-2067999",
  "BETIQ-2075050",
  "BETIQ-2082113",
  "BETIQ-2089188",
  "BETIQ-2096275",
  "BETIQ-2103374",
  "BETIQ-2110485",
  "BETIQ-2117608",
  "BETIQ-2124743",
  "BETIQ-2131890",
  "BETIQ-2139049",
  "BETIQ-2146220",
  "BETIQ-2153403",
  "BETIQ-2160598",
  "BETIQ-2167805",
  "BETIQ-2175024",
  "BETIQ-2182255",
  "BETIQ-2189498",
  "BETIQ-2196753",
  "BETIQ-2204020",
  "BETIQ-2211299",
  "BETIQ-2218590",
  "BETIQ-2225893",
  "BETIQ-2233208",
  "BETIQ-2240535",
  "BETIQ-2247874",
  "BETIQ-2255225",
  "BETIQ-2262588",
  "BETIQ-2269963",
  "BETIQ-2277350",
  "BETIQ-2284749",
  "BETIQ-2292160",
  "BETIQ-2299583",
  "BETIQ-2307018",
  "BETIQ-2314465",
  "BETIQ-2321924",
  "BETIQ-2329395",
  "BETIQ-2336878",
  "BETIQ-2344373",
  "BETIQ-2351880",
  "BETIQ-2359399",
  "BETIQ-2366930",
  "BETIQ-2374473",
  "BETIQ-2382028",
  "BETIQ-2389595",
  "BETIQ-2397174",
  "BETIQ-2404765",
  "BETIQ-2412368",
  "BETIQ-2419983",
  "BETIQ-2427610",
  "BETIQ-2435249",
  "BETIQ-2442900",
  "BETIQ-2450563",
  "BETIQ-2458238",
  "BETIQ-2465925",
  "BETIQ-2473624",
  "BETIQ-2481335",
  "BETIQ-2489058",
  "BETIQ-2496793",
  "BETIQ-2504540",
  "BETIQ-2512299",
  "BETIQ-2520070",
  "BETIQ-2527853",
  "BETIQ-2535648",
  "BETIQ-2543455",
  "BETIQ-2551274",
  "BETIQ-2559105",
  "BETIQ-2566948",
  "BETIQ-2574803",
  "BETIQ-2582670",
  "BETIQ-2590549",
  "BETIQ-2598440",
  "BETIQ-2606343",
  "BETIQ-2614258",
  "BETIQ-2622185",
  "BETIQ-2630124",
  "BETIQ-2638075",
  "BETIQ-2646038",
  "BETIQ-2654013",
  "BETIQ-2662000",
  "BETIQ-2669999",
  "BETIQ-2678010",
  "BETIQ-2686033",
  "BETIQ-2694068",
  "BETIQ-2702115",
  "BETIQ-2710174",
  "BETIQ-2718245",
  "BETIQ-2726328",
  "BETIQ-2734423",
  "BETIQ-2742530",
  "BETIQ-2750649",
  "BETIQ-2758780",
  "BETIQ-2766923",
  "BETIQ-2775078",
  "BETIQ-2783245",
  "BETIQ-2791424",
  "BETIQ-2799615",
  "BETIQ-2807818",
  "BETIQ-2816033",
  "BETIQ-2824260",
  "BETIQ-2832499",
  "BETIQ-2840750",
  "BETIQ-2849013",
  "BETIQ-2857288",
  "BETIQ-2865575",
  "BETIQ-2873874",
  "BETIQ-2882185",
  "BETIQ-2890508",
  "BETIQ-2898843",
  "BETIQ-2907190",
  "BETIQ-2915549",
  "BETIQ-2923920",
  "BETIQ-2932303",
  "BETIQ-2940698",
  "BETIQ-2949105",
  "BETIQ-2957524",
  "BETIQ-2965955",
  "BETIQ-2974398",
  "BETIQ-2982853",
  "BETIQ-2991320",
  "BETIQ-2999799",
  "BETIQ-3008290",
  "BETIQ-3016793",
  "BETIQ-3025308",
  "BETIQ-3033835",
  "BETIQ-3042374",
  "BETIQ-3050925",
  "BETIQ-3059488",
  "BETIQ-3068063",
  "BETIQ-3076650",
  "BETIQ-3085249",
  "BETIQ-3093860",
  "BETIQ-3102483",
  "BETIQ-3111118",
  "BETIQ-3119765",
  "BETIQ-3128424",
  "BETIQ-3137095",
  "BETIQ-3145778",
  "BETIQ-3154473",
  "BETIQ-3163180",
  "BETIQ-3171899",
  "BETIQ-3180630",
  "BETIQ-3189373",
  "BETIQ-3198128",
  "BETIQ-3206895",
  "BETIQ-3215674",
  "BETIQ-3224465",
  "BETIQ-3233268",
  "BETIQ-3242083",
  "BETIQ-3250910",
  "BETIQ-3259749",
  "BETIQ-3268600",
  "BETIQ-3277463",
  "BETIQ-3286338",
  "BETIQ-3295225",
  "BETIQ-3304124",
  "BETIQ-3313035",
  "BETIQ-3321958",
  "BETIQ-3330893",
  "BETIQ-3339840",
  "BETIQ-3348799",
  "BETIQ-3357770",
  "BETIQ-3366753",
  "BETIQ-3375748",
  "BETIQ-3384755",
  "BETIQ-3393774",
  "BETIQ-3402805",
  "BETIQ-3411848",
  "BETIQ-3420903",
  "BETIQ-3429970",
  "BETIQ-3439049",
  "BETIQ-3448140",
  "BETIQ-3457243",
  "BETIQ-3466358",
  "BETIQ-3475485",
  "BETIQ-3484624",
  "BETIQ-3493775",
  "BETIQ-3502938",
  "BETIQ-3512113",
  "BETIQ-3521300",
  "BETIQ-3530499",
  "BETIQ-3539710",
  "BETIQ-3548933",
  "BETIQ-3558168",
  "BETIQ-3567415",
  "BETIQ-3576674",
  "BETIQ-3585945",
  "BETIQ-3595228",
  "BETIQ-3604523",
  "BETIQ-3613830",
  "BETIQ-3623149",
  "BETIQ-3632480",
  "BETIQ-3641823",
  "BETIQ-3651178",
  "BETIQ-3660545",
  "BETIQ-3669924",
  "BETIQ-3679315",
  "BETIQ-3688718",
  "BETIQ-3698133",
  "BETIQ-3707560",
  "BETIQ-3716999",
  "BETIQ-3726450",
  "BETIQ-3735913",
  "BETIQ-3745388",
  "BETIQ-3754875",
  "BETIQ-3764374",
  "BETIQ-3773885",
  "BETIQ-3783408",
  "BETIQ-3792943",
  "BETIQ-3802490",
  "BETIQ-3812049",
  "BETIQ-3821620",
  "BETIQ-3831203",
  "BETIQ-3840798",
  "BETIQ-3850405",
  "BETIQ-3860024",
  "BETIQ-3869655",
  "BETIQ-3879298",
  "BETIQ-3888953",
  "BETIQ-3898620",
  "BETIQ-3908299",
  "BETIQ-3917990",
  "BETIQ-3927693",
  "BETIQ-3937408",
  "BETIQ-3947135",
  "BETIQ-3956874",
  "BETIQ-3966625",
  "BETIQ-3976388",
  "BETIQ-3986163",
  "BETIQ-3995950",
  "BETIQ-4005749",
  "BETIQ-4015560",
  "BETIQ-4025383",
  "BETIQ-4035218",
  "BETIQ-4045065",
  "BETIQ-4054924",
  "BETIQ-4064795",
  "BETIQ-4074678",
  "BETIQ-4084573",
  "BETIQ-4094480",
  "BETIQ-4104399",
  "BETIQ-4114330",
  "BETIQ-4124273",
  "BETIQ-4134228",
  "BETIQ-4144195",
  "BETIQ-4154174",
  "BETIQ-4164165",
  "BETIQ-4174168",
  "BETIQ-4184183",
  "BETIQ-4194210",
  "BETIQ-4204249",
  "BETIQ-4214300",
  "BETIQ-4224363",
  "BETIQ-4234438",
  "BETIQ-4244525",
  "BETIQ-4254624",
  "BETIQ-4264735",
  "BETIQ-4274858",
  "BETIQ-4284993",
  "BETIQ-4295140",
  "BETIQ-4305299",
  "BETIQ-4315470",
  "BETIQ-4325653",
  "BETIQ-4335848",
  "BETIQ-4346055",
  "BETIQ-4356274",
  "BETIQ-4366505",
  "BETIQ-4376748",
  "BETIQ-4387003",
  "BETIQ-4397270",
  "BETIQ-4407549",
  "BETIQ-4417840",
  "BETIQ-4428143",
  "BETIQ-4438458",
  "BETIQ-4448785",
  "BETIQ-4459124",
  "BETIQ-4469475",
  "BETIQ-4479838",
  "BETIQ-4490213",
  "BETIQ-4500600",
  "BETIQ-4510999",
  "BETIQ-4521410",
  "BETIQ-4531833",
  "BETIQ-4542268",
  "BETIQ-4552715",
  "BETIQ-4563174",
  "BETIQ-4573645",
  "BETIQ-4584128",
  "BETIQ-4594623",
  "BETIQ-4605130",
  "BETIQ-4615649",
  "BETIQ-4626180",
  "BETIQ-4636723",
  "BETIQ-4647278",
  "BETIQ-4657845",
  "BETIQ-4668424",
  "BETIQ-4679015",
  "BETIQ-4689618",
  "BETIQ-4700233",
  "BETIQ-4710860",
  "BETIQ-4721499",
  "BETIQ-4732150",
  "BETIQ-4742813",
  "BETIQ-4753488",
  "BETIQ-4764175",
  "BETIQ-4774874",
  "BETIQ-4785585",
  "BETIQ-4796308",
  "BETIQ-4807043",
  "BETIQ-4817790",
  "BETIQ-4828549",
  "BETIQ-4839320",
  "BETIQ-4850103",
  "BETIQ-4860898",
  "BETIQ-4871705",
  "BETIQ-4882524",
  "BETIQ-4893355",
  "BETIQ-4904198",
  "BETIQ-4915053",
  "BETIQ-4925920",
  "BETIQ-4936799",
  "BETIQ-4947690",
  "BETIQ-4958593",
  "BETIQ-4969508",
  "BETIQ-4980435",
  "BETIQ-4991374",
  "BETIQ-5002325",
  "BETIQ-5013288",
  "BETIQ-5024263",
  "BETIQ-5035250",
  "BETIQ-5046249",
  "BETIQ-5057260",
  "BETIQ-5068283",
  "BETIQ-5079318",
  "BETIQ-5090365",
  "BETIQ-5101424",
  "BETIQ-5112495",
  "BETIQ-5123578",
  "BETIQ-5134673",
  "BETIQ-5145780",
  "BETIQ-5156899",
  "BETIQ-5168030",
  "BETIQ-5179173",
  "BETIQ-5190328",
  "BETIQ-5201495",
  "BETIQ-5212674",
  "BETIQ-5223865",
  "BETIQ-5235068",
  "BETIQ-5246283",
  "BETIQ-5257510",
  "BETIQ-5268749",
  "BETIQ-5280000",
  "BETIQ-5291263",
  "BETIQ-5302538",
  "BETIQ-5313825",
  "BETIQ-5325124",
  "BETIQ-5336435",
  "BETIQ-5347758",
  "BETIQ-5359093",
  "BETIQ-5370440",
  "BETIQ-5381799",
  "BETIQ-5393170",
  "BETIQ-5404553",
  "BETIQ-5415948",
  "BETIQ-5427355",
  "BETIQ-5438774",
  "BETIQ-5450205",
  "BETIQ-5461648",
  "BETIQ-5473103",
  "BETIQ-5484570",
  "BETIQ-5496049",
  "BETIQ-5507540",
  "BETIQ-5519043",
  "BETIQ-5530558",
  "BETIQ-5542085",
  "BETIQ-5553624",
  "BETIQ-5565175",
  "BETIQ-5576738",
  "BETIQ-5588313",
  "BETIQ-5599900",
  "BETIQ-5611499",
  "BETIQ-5623110",
  "BETIQ-5634733",
  "BETIQ-5646368",
  "BETIQ-5658015",
  "BETIQ-5669674",
  "BETIQ-5681345",
  "BETIQ-5693028",
  "BETIQ-5704723",
  "BETIQ-5716430",
  "BETIQ-5728149",
  "BETIQ-5739880",
  "BETIQ-5751623",
  "BETIQ-5763378",
  "BETIQ-5775145",
  "BETIQ-5786924",
  "BETIQ-5798715",
  "BETIQ-5810518",
  "BETIQ-5822333",
  "BETIQ-5834160",
  "BETIQ-5845999",
  "BETIQ-5857850",
  "BETIQ-5869713",
  "BETIQ-5881588",
  "BETIQ-5893475",
  "BETIQ-5905374",
  "BETIQ-5917285",
  "BETIQ-5929208",
  "BETIQ-5941143",
  "BETIQ-5953090",
  "BETIQ-5965049",
  "BETIQ-5977020",
  "BETIQ-5989003",
  "BETIQ-6000998",
  "BETIQ-6013005",
  "BETIQ-6025024",
  "BETIQ-6037055",
  "BETIQ-6049098",
  "BETIQ-6061153",
  "BETIQ-6073220",
  "BETIQ-6085299",
  "BETIQ-6097390",
  "BETIQ-6109493",
  "BETIQ-6121608",
  "BETIQ-6133735",
  "BETIQ-6145874",
  "BETIQ-6158025",
  "BETIQ-6170188",
  "BETIQ-6182363",
  "BETIQ-6194550",
  "BETIQ-6206749",
  "BETIQ-6218960",
  "BETIQ-6231183",
  "BETIQ-6243418",
  "BETIQ-6255665",
  "BETIQ-6267924",
  "BETIQ-6280195",
  "BETIQ-6292478",
  "BETIQ-6304773",
  "BETIQ-6317080",
  "BETIQ-6329399",
  "BETIQ-6341730",
  "BETIQ-6354073",
  "BETIQ-6366428",
  "BETIQ-6378795",
  "BETIQ-6391174",
  "BETIQ-6403565",
  "BETIQ-6415968",
  "BETIQ-6428383",
  "BETIQ-6440810",
  "BETIQ-6453249",
  "BETIQ-6465700",
  "BETIQ-6478163",
  "BETIQ-6490638",
  "BETIQ-6503125",
  "BETIQ-6515624",
  "BETIQ-6528135",
  "BETIQ-6540658",
  "BETIQ-6553193",
  "BETIQ-6565740",
  "BETIQ-6578299",
  "BETIQ-6590870",
  "BETIQ-6603453",
  "BETIQ-6616048",
  "BETIQ-6628655",
  "BETIQ-6641274",
  "BETIQ-6653905",
  "BETIQ-6666548",
  "BETIQ-6679203",
  "BETIQ-6691870",
  "BETIQ-6704549",
  "BETIQ-6717240",
  "BETIQ-6729943",
  "BETIQ-6742658",
  "BETIQ-6755385",
  "BETIQ-6768124",
  "BETIQ-6780875",
  "BETIQ-6793638",
  "BETIQ-6806413",
  "BETIQ-6819200",
  "BETIQ-6831999",
  "BETIQ-6844810",
  "BETIQ-6857633",
  "BETIQ-6870468",
  "BETIQ-6883315",
  "BETIQ-6896174",
  "BETIQ-6909045",
  "BETIQ-6921928",
  "BETIQ-6934823",
  "BETIQ-6947730",
  "BETIQ-6960649",
  "BETIQ-6973580",
  "BETIQ-6986523",
  "BETIQ-6999478",
  "BETIQ-7012445",
  "BETIQ-7025424",
  "BETIQ-7038415",
  "BETIQ-7051418",
  "BETIQ-7064433",
  "BETIQ-7077460",
  "BETIQ-7090499",
  "BETIQ-7103550",
  "BETIQ-7116613",
  "BETIQ-7129688",
  "BETIQ-7142775",
  "BETIQ-7155874",
  "BETIQ-7168985",
  "BETIQ-7182108",
  "BETIQ-7195243",
  "BETIQ-7208390",
  "BETIQ-7221549",
  "BETIQ-7234720",
  "BETIQ-7247903",
  "BETIQ-7261098",
  "BETIQ-7274305",
  "BETIQ-7287524",
  "BETIQ-7300755",
  "BETIQ-7313998",
  "BETIQ-7327253",
  "BETIQ-7340520",
  "BETIQ-7353799",
  "BETIQ-7367090",
  "BETIQ-7380393",
  "BETIQ-7393708",
  "BETIQ-7407035",
  "BETIQ-7420374",
  "BETIQ-7433725",
  "BETIQ-7447088",
  "BETIQ-7460463",
  "BETIQ-7473850",
  "BETIQ-7487249",
  "BETIQ-7500660",
  "BETIQ-7514083",
  "BETIQ-7527518",
  "BETIQ-7540965",
  "BETIQ-7554424",
  "BETIQ-7567895",
  "BETIQ-7581378",
  "BETIQ-7594873",
  "BETIQ-7608380",
  "BETIQ-7621899",
  "BETIQ-7635430",
  "BETIQ-7648973",
  "BETIQ-7662528",
  "BETIQ-7676095",
  "BETIQ-7689674",
  "BETIQ-7703265",
  "BETIQ-7716868",
  "BETIQ-7730483",
  "BETIQ-7744110",
  "BETIQ-7757749",
  "BETIQ-7771400",
  "BETIQ-7785063",
  "BETIQ-7798738"];
const VALID_USER_CODES = new Set(VALID_CODES_ARRAY);

const DICTIONARY = {
  FR: {
    freeTitle: "PRÉDICTIONS GRATUITES",
    vipTitle: "ZONE ELITE VIP",
    settingsTitle: "RÉGLAGES",
    vipSubtitle: "Signal Haute Précision",
    vipCardHeader: "LA CARTE GAGNANTE : LES 3 SÉLECTIONS 100% ACCURATE",
    searchPlaceholder: "Chercher match, ligue...",
    userConnected: "Utilisateur Connecté",
    appLanguage: "Langue de l'application",
    activationVip: "ACTIVATION VIP",
    vipDescription: "Le VIP débloque les 3 sélections 100% gagnantes et les analyses tactiques des ligues élites (UCL, Premier League, CAN).",
    buyCode: "ACHETER UN CODE",
    verify: "VÉRIFIER",
    logout: "Se déconnecter",
    vipActive: "ABONNEMENT ELITE ACTIF",
    loadingAi: "IA en recherche Google (Vérification des effectifs réels)...",
    tacticalAnalysis: "Analyse Tactique (Faits Vérifiés)",
    advancedSignals: "Signaux Avancés",
    probableScorers: "Buteurs Potentiels",
    googleSources: "Preuves de Vérification (Sources Web)",
    iaUnlocked: "ANALYSE IA DÉBLOQUÉE",
    noMatches: "Aucun match trouvé pour ce jour/ligue",
    all: "Tous",
    checkVip: "DÉBLOQUER VIP",
    auth: "Authentification",
    createAccount: "Créer un compte",
    login: "Connexion",
    register: "S'inscrire",
    newUser: "Nouveau ? Créer un compte",
    alreadyMember: "Déjà membre ? Se connecter",
    navFree: "GRATUIT",
    navVip: "VIP",
    navSettings: "RÉGLAGES",
    maxConfidence: "CONFIANCE MAX",
    probaLabel: "PROBA",
    statCorners: "Corners",
    statCards: "Cartons",
    statShots: "Nb. de tirs durant le match",
    statOnTarget: "Tirs cadrés",
    statOffsides: "Hors-jeu",
    statFouls: "Fautes",
    statThrowIns: "Touches",
    sourceInfo: "Ces informations sont vérifiées en temps réel via Google Search."
  },
  EN: {
    freeTitle: "FREE PREDICTIONS",
    vipTitle: "ELITE VIP ZONE",
    settingsTitle: "SETTINGS",
    vipSubtitle: "High Precision Signal",
    vipCardHeader: "THE WINNING CARD: THE 3 100% ACCURATE SELECTIONS",
    searchPlaceholder: "Search match, league...",
    userConnected: "Connected User",
    appLanguage: "App Language",
    activationVip: "VIP ACTIVATION",
    vipDescription: "VIP unlocks 3 daily 100% winning selections and tactical analysis for elite leagues (UCL, Premier League, CAN).",
    buyCode: "BUY A CODE",
    verify: "VERIFY",
    logout: "Log Out",
    vipActive: "ELITE SUBSCRIPTION ACTIVE",
    loadingAi: "AI Google Search (Real Squad Verification)...",
    tacticalAnalysis: "Tactical Analysis (Verified Facts)",
    advancedSignals: "Advanced Signals",
    probableScorers: "Potential Scorers",
    googleSources: "Verification Proofs (Web Sources)",
    iaUnlocked: "AI ANALYSIS UNLOCKED",
    noMatches: "No matches found for this day/league",
    all: "All",
    checkVip: "UNLOCK VIP",
    auth: "Authentication",
    createAccount: "Create account",
    login: "Login",
    register: "Register",
    newUser: "New here? Create an account",
    alreadyMember: "Already a member? Login",
    navFree: "FREE",
    navVip: "VIP",
    navSettings: "SETTINGS",
    maxConfidence: "MAX CONFIDENCE",
    probaLabel: "PROB",
    statCorners: "Corners",
    statCards: "Cards",
    statShots: "Number of shots during match",
    statOnTarget: "Shots on target",
    statOffsides: "Offsides",
    statFouls: "Fouls",
    statThrowIns: "Throw-ins",
    sourceInfo: "This information is verified in real-time via Google Search."
  }
};

const ELITE_TEAMS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Arsenal', 'Bayern Munich', 'PSG', 'Inter', 'AC Milan', 'Juventus', 'Dortmund', 'Chelsea', 'Atletico', 'Man Utd', 'Tottenham', 'Espagne', 'France', 'Brazil', 'Argentina'];

const isPopularMatch = (match: FootballMatch) => {
  const eliteKeywords = ['Champions League', 'Europa League', 'Conference League', 'Libertadores', 'CAN', 'Cup of Nations', 'World Cup', 'Euro', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Coupe du Roi'];
  return ELITE_TEAMS.some(t => match.homeTeam.includes(t) || match.awayTeam.includes(t)) || 
         eliteKeywords.some(k => match.league.toLowerCase().includes(k.toLowerCase()));
};

const LeagueSelector: React.FC<{ selected: string, onSelect: (s: string) => void, lang: Language }> = ({ selected, onSelect, lang }) => {
  const t = DICTIONARY[lang];
  const LEAGUE_BUTTONS = [
    { id: 'all', name: t.all, icon: <Globe size={12}/> },
    { id: '28', name: 'CAN', icon: <Trophy size={12}/> },
    { id: 'ucl', name: 'Champions League', icon: <Trophy size={12}/> },
    { id: '152', name: 'Premier League', icon: <Target size={12}/> },
    { id: '302', name: 'La Liga', icon: <Target size={12}/> },
    { id: '207', name: 'Serie A', icon: <Target size={12}/> },
    { id: '175', name: 'Bundesliga', icon: <Target size={12}/> },
    { id: '168', name: 'Ligue 1', icon: <Target size={12}/> },
    { id: 'brasileirao', name: 'Brasileirão', icon: <Target size={12}/> },
    { id: 'mls', name: 'MLS', icon: <Target size={12}/> },
    { id: 'copadelrey', name: 'Coupe du Roi', icon: <Trophy size={12}/> },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {LEAGUE_BUTTONS.map(cat => (
        <button key={cat.id} onClick={() => onSelect(cat.id)} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase border transition-all ${selected === cat.id ? 'bg-[#c18c32] border-[#c18c32] text-slate-950 shadow-lg' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
          {cat.icon}{cat.name}
        </button>
      ))}
    </div>
  );
};

const FreePredictionsView: React.FC<any> = ({ matches, loading, lang }) => {
  const navigate = useNavigate();
  const t = DICTIONARY[lang];
  const freeMatches = useMemo(() => matches.filter(m => !isPopularMatch(m)).slice(0, 3), [matches]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
        <LayoutGrid className="text-blue-400" />
        {t.freeTitle.split(' ')[0]} <span className="text-blue-400">{t.freeTitle.split(' ')[1]}</span>
      </h2>
      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-400" /></div> : (
          freeMatches.map(m => (
            <div key={m.id} onClick={() => navigate(`/match/${m.id}`, { state: { match: m } })} className="bg-[#0b1121]/60 border border-white/5 rounded-[2.2rem] p-6 cursor-pointer active:scale-95 transition-all">
               <div className="text-center text-[10px] font-black text-slate-600 mb-4 uppercase">{m.time}</div>
               <div className="flex items-center justify-around">
                  <div className="text-center w-2/5 flex flex-col items-center gap-2">
                    <img src={m.homeLogo} className="w-12 h-12 object-contain" alt="" />
                    <span className="text-[10px] font-black text-white uppercase truncate w-full">{m.homeTeam}</span>
                  </div>
                  <div className="text-xs opacity-20">VS</div>
                  <div className="text-center w-2/5 flex flex-col items-center gap-2">
                    <img src={m.awayLogo} className="w-12 h-12 object-contain" alt="" />
                    <span className="text-[10px] font-black text-white uppercase truncate w-full">{m.awayTeam}</span>
                  </div>
               </div>
               <div className="mt-4 bg-blue-500/10 py-2 rounded-xl text-center text-[9px] font-black text-blue-400 uppercase tracking-widest">{t.iaUnlocked}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const VipZoneView: React.FC<any> = ({ matches, loading, isVip, selectedDate, onDateChange, lang }) => {
  const navigate = useNavigate();
  const t = DICTIONARY[lang];
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const dailySelections = useMemo(() => matches.filter(isPopularMatch).slice(0, 3), [matches]);

  const allFilteredMatches = useMemo(() => {
    const list = matches.filter(m => {
      const matchSearch = m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedLeague === 'all') return matchSearch;
      if (!isNaN(Number(selectedLeague))) return m.league_id === selectedLeague && matchSearch;
      return m.league.toLowerCase().includes(selectedLeague.toLowerCase()) && matchSearch;
    });
    return [...list].sort((a, b) => (isPopularMatch(b) ? 1 : 0) - (isPopularMatch(a) ? 1 : 0));
  }, [matches, selectedLeague, searchTerm]);

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <header className="flex items-center gap-3 mb-8">
        <Crown size={32} className="text-[#c18c32]" />
        <div>
          <h2 className="text-2xl font-black uppercase italic text-white">{t.vipTitle}</h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{t.vipSubtitle}</p>
        </div>
      </header>

      <div className="space-y-6 mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1121] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white outline-none" 
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[0,1,2,3,4,5,6,7].map(i => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            return (
              <button key={iso} onClick={() => onDateChange(iso)} className={`flex-shrink-0 min-w-[3.5rem] py-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${iso === selectedDate ? 'bg-[#c18c32] border-[#c18c32] text-slate-950' : 'bg-[#0b1121] border-white/5 text-slate-500'}`}>
                <span className="text-[7px] font-black uppercase">{d.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { weekday: 'short' })}</span>
                <span className="text-xs font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <section className="space-y-4">
          <div className="bg-[#c18c32]/10 p-4 rounded-2xl border-l-4 border-[#c18c32]">
            <h3 className="text-[10px] font-black text-white uppercase italic">{t.vipCardHeader}</h3>
          </div>
          <div className="space-y-3">
            {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div> : dailySelections.map(m => (
              <VipSafeCard key={m.id} match={m} isLocked={!isVip} lang={lang} onClick={() => {
                if (!isVip) navigate('/settings');
                else navigate(`/match/${m.id}`, { state: { match: m } });
              }} />
            ))}
          </div>
        </section>

        <LeagueSelector selected={selectedLeague} onSelect={setSelectedLeague} lang={lang} />
      </div>

      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-orange-500" /></div> : (
          allFilteredMatches.map(m => (
            <MatchCard 
              key={m.id} 
              match={m} 
              isVipUser={isVip} 
              forceLock={true} 
              lang={lang}
              onClick={(match) => {
                if (!isVip) navigate('/settings');
                else navigate(`/match/${match.id}`, { state: { match } });
              }} 
            />
          ))
        )}
        {!loading && allFilteredMatches.length === 0 && <p className="text-center text-slate-500 text-[10px] font-black uppercase py-10">{t.noMatches}</p>}
      </div>
    </div>
  );
};

const SettingsView: React.FC<any> = ({ isVip, setIsVip, userEmail, language, setLanguage }) => {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const t = DICTIONARY[language];

  const activateVip = () => {
    if (VALID_USER_CODES.has(code) || code === ADMIN_CODE) {
      setIsVip(true);
      localStorage.setItem(`btq_vip_status_${userEmail}`, 'true');
      localStorage.setItem(`btq_vip_start_${userEmail}`, Date.now().toString());
      setMsg(language === 'FR' ? "VIP ACTIVÉ !" : "VIP ACTIVATED!");
      setTimeout(() => navigate('/vip'), 1500);
    } else { setMsg(language === 'FR' ? "Code invalide." : "Invalid code."); }
  };

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-10">
      <h2 className="text-2xl font-black uppercase italic mb-8">{t.settingsTitle}</h2>
      <div className="space-y-6">
        <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Mail size={20}/></div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase">{t.userConnected}</p>
              <p className="text-xs font-bold text-white">{userEmail}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Languages size={12}/> {t.appLanguage}</p>
            <div className="flex gap-2">
              {['FR', 'EN'].map(l => (
                <button 
                  key={l} 
                  onClick={() => { setLanguage(l as Language); localStorage.setItem('lang', l); }}
                  className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${language === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500'}`}
                >
                  {l === 'FR' ? 'FRANÇAIS' : 'ENGLISH'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0b1121] p-6 rounded-[2rem] border border-[#c18c32]/20">
          <h3 className="text-[10px] font-black text-[#c18c32] uppercase mb-4 flex items-center gap-2"><Crown size={12}/> {t.activationVip}</h3>
          {!isVip ? (
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold">{t.vipDescription}</p>
              <a href={PAYMENT_LINK} target="_blank" rel="noreferrer" className="block text-center w-full bg-[#c18c32] text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#c18c32]/20">{t.buyCode}</a>
              <div className="flex gap-2">
                <input type="text" placeholder="Code" value={code} onChange={e => setCode(e.target.value)} className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 text-xs outline-none text-white font-bold" />
                <button onClick={activateVip} className="bg-white text-slate-950 px-6 py-4 rounded-xl font-black text-xs uppercase">{t.verify}</button>
              </div>
              {msg && <p className="text-[10px] font-bold text-center text-[#c18c32] uppercase animate-pulse">{msg}</p>}
            </div>
          ) : <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-xs italic bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20"><ShieldCheck size={16}/> {t.vipActive}</div>}
        </div>
        
        <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 text-rose-500 font-black uppercase text-xs p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/20 transition-all active:scale-95"><LogOut size={16}/> {t.logout}</button>
      </div>
    </div>
  );
};

const MatchDetailView: React.FC<any> = ({ language }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const match = state?.match as FootballMatch;
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const t = DICTIONARY[language as Language];

  useEffect(() => {
    if (!match) { navigate('/'); return; }
    const getAnalysis = async () => {
      setLoading(true);
      const res = await generatePredictionsAndAnalysis(match, language);
      setAnalysis(res);
      setLoading(false);
    };
    getAnalysis();
  }, [match, language, navigate]);

  if (!match) return null;

  return (
    <div className="pb-32 px-5 max-w-2xl mx-auto pt-6">
      <button onClick={() => navigate(-1)} className="p-3 bg-slate-900 rounded-2xl mb-6"><ChevronLeft size={20}/></button>
      
      <div className="bg-gradient-to-br from-[#0b1121] to-[#151c30] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl mb-8">
        <div className="flex justify-between items-center mb-10">
          <div className="text-center w-2/5 flex flex-col items-center gap-3">
             <img src={match.homeLogo} className="w-16 h-16 object-contain" alt="" />
             <p className="text-[10px] font-black uppercase text-white">{match.homeTeam}</p>
          </div>
          <div className="text-xl font-black italic opacity-20 text-slate-600">VS</div>
          <div className="text-center w-2/5 flex flex-col items-center gap-3">
             <img src={match.awayLogo} className="w-16 h-16 object-contain" alt="" />
             <p className="text-[10px] font-black uppercase text-white">{match.awayTeam}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center px-4">{t.loadingAi}</p>
          </div>
        ) : analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {analysis.predictions.map((p, i) => (
                <div key={i} className="bg-slate-950/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-slate-950">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">{p.type}</p>
                    <p className="text-sm font-black text-white">{p.recommendation}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <ConfidenceIndicator level={p.confidence as Confidence} lang={language as Language} />
                    <div className="flex items-baseline gap-1">
                       <p className="text-xl font-black text-blue-400">{p.probability}%</p>
                       <p className="text-[8px] font-black text-slate-500 uppercase">{t.probaLabel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10"><BrainCircuit size={40} /></div>
              <h4 className="text-[10px] font-black text-blue-400 uppercase mb-3 flex items-center gap-2"><Target size={14}/> {t.tacticalAnalysis}</h4>
              <p className="text-xs leading-relaxed text-slate-300 italic font-medium">{analysis.analysis}</p>
            </div>

            {analysis.vipInsight.detailedStats && (
              <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-5">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-3">{t.probableScorers}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {analysis.vipInsight.detailedStats.scorers.map((s, idx) => (
                      <div key={idx} className="flex flex-col bg-slate-950/40 p-3.5 rounded-xl border border-white/5 gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-white font-bold">{s.name}</span>
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">{s.team}</p>
                          </div>
                          <ConfidenceIndicator level={s.confidence as Confidence} lang={language as Language} />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${s.probability}%` }}></div>
                          </div>
                          <span className="text-[10px] text-blue-400 font-black">{s.probability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {analysis.sources && analysis.sources.length > 0 && (
              <div className="bg-orange-500/5 p-6 rounded-3xl border border-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2"><ExternalLink size={14}/> {t.googleSources}</h4>
                  <div className="group relative">
                    <Info size={12} className="text-slate-500 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-[8px] text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none z-50">
                      {t.sourceInfo}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {analysis.sources.map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl hover:bg-slate-950 transition-all border border-white/5 group">
                      <span className="text-[10px] text-slate-300 truncate w-3/4 group-hover:text-white transition-colors">{src.title}</span>
                      <ExternalLink size={12} className="text-orange-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AuthView: React.FC<{ lang: Language }> = ({ lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const t = DICTIONARY[lang];

  const handleAuth = async () => {
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-[#0b1121] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="text-center">
          <BrainCircuit size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">BETI<span className="text-orange-500">Q</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-2">{isLogin ? t.auth : t.createAccount}</p>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm outline-none text-white" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm outline-none text-white" />
          {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
          <button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20">{isLogin ? t.login : t.register}</button>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest py-2 hover:text-white transition-colors">{isLogin ? t.newUser : t.alreadyMember}</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'FR');
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const t = DICTIONARY[language];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        const status = localStorage.getItem(`btq_vip_status_${u.email}`) === 'true';
        if (status) {
          const startStr = localStorage.getItem(`btq_vip_start_${u.email}`);
          if (startStr && (Date.now() - parseInt(startStr) > 30 * 24 * 60 * 60 * 1000)) {
            setIsVip(false); localStorage.setItem(`btq_vip_status_${u.email}`, 'false');
          } else setIsVip(true);
        } else setIsVip(false);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchMatchesData = async (date: string) => {
    setLoading(true); try { 
      const data = await fetchMatchesByDate(date); 
      setMatches(data.map(m => ({ id: m.match_id, league: m.league_name, league_id: m.league_id, homeTeam: m.match_hometeam_name, awayTeam: m.match_awayteam_name, homeLogo: m.team_home_badge, awayLogo: m.team_away_badge, time: m.match_time, status: m.match_status, country_name: m.country_name, stats: { homeForm: [], awayForm: [], homeRank: 0, awayRank: 0, h2h: '' }, predictions: [] }))); 
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchMatchesData(selectedDate); }, [selectedDate, user]);

  if (authLoading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8"><BrainCircuit size={64} className="text-blue-400 animate-pulse" /></div>;
  if (!user) return <AuthView lang={language} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      <Routes>
        <Route path="/" element={isVip ? <Navigate to="/vip" /> : <FreePredictionsView matches={matches} loading={loading} lang={language} />} />
        <Route path="/vip" element={<VipZoneView matches={matches} loading={loading} isVip={isVip} selectedDate={selectedDate} onDateChange={setSelectedDate} lang={language} />} />
        <Route path="/settings" element={<SettingsView isVip={isVip} setIsVip={setIsVip} userEmail={user.email} language={language} setLanguage={setLanguage} />} />
        <Route path="/match/:id" element={<MatchDetailView language={language} />} />
        <Route path="*" element={<Navigate to={isVip ? "/vip" : "/"} />} />
      </Routes>
      
      <nav className="fixed bottom-6 left-6 right-6 bg-[#0b1121]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-3 flex items-center justify-around z-50 shadow-2xl">
        {!isVip && (
          <Link to="/" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400 transition-colors">
            <LayoutGrid size={22} /><span className="text-[7px] font-black uppercase">{t.navFree}</span>
          </Link>
        )}
        <Link to="/vip" className="flex flex-col items-center group relative px-4">
          <div className={`${isVip ? 'bg-[#c18c32] shadow-[#c18c32]/20' : 'bg-orange-500 shadow-orange-500/20'} p-3.5 rounded-full -mt-12 border-[6px] border-[#020617] shadow-xl transition-transform`}>
            {isVip ? <Crown size={26} className="text-slate-950" /> : <Lock size={24} className="text-slate-950" />}
          </div>
          <span className={`text-[8px] font-black mt-1.5 uppercase italic tracking-widest ${isVip ? 'text-[#c18c32]' : 'text-orange-500'}`}>{t.navVip}</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center gap-1.5 p-3 text-slate-500 hover:text-blue-400 transition-colors">
          <Settings size={22} /><span className="text-[7px] font-black uppercase">{t.navSettings}</span>
        </Link>
      </nav>
    </div>
  );
};

export default () => <HashRouter><App /></HashRouter>;
