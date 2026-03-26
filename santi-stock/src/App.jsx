import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabase';

// ── Product master data (596 SKUs) ──────────────────────
const PR = [["PD-100002","9 September 500g.","Espresso",360.0,209.73],["PD-100003","9 September 1 kg.","Espresso",720.0,419.46],["PD-100004","Asian Blend 250g.","Espresso",240.0,107.44],["PD-100005","Asian Blend 500g.","Espresso",340.0,230.83],["PD-100006","Asian Blend 1 kg.","Espresso",680.0,461.65],["PD-100007","Brazil 222 250g.","Espresso",240.0,103.45],["PD-100008","Brazil 222 500g.","Espresso",390.0,222.86],["PD-100009","Brazil 222 1 kg.","Espresso",780.0,445.71],["PD-100010","Brazil Santos M 200g","Espresso",240.0,103.45],["PD-100011","Brazil Santos M 500g","Espresso",375.0,222.86],["PD-100012","Brazil Santos M 1kg.","Espresso",750.0,445.71],["PD-100013","Brazil Santos MD200g","Espresso",240.0,103.45],["PD-100014","Brazil Santos MD500g","Espresso",375.0,222.86],["PD-100015","Brazil Santos MD1kg.","Espresso",750.0,445.71],["PD-100016","Brazilian 250g.","Espresso",240.0,103.45],["PD-100017","Brazilian 500g.","Espresso",390.0,222.86],["PD-100018","Brazilian 1 kg.","Espresso",780.0,445.71],["PD-100019","Caramelized 250g.","Espresso",245.0,96.89],["PD-100020","Caramelized 500g.","Espresso",360.0,209.73],["PD-100021","Caramelized 1 kg.","Espresso",720.0,419.46],["PD-100022","Colombia SPM(M)200g.","Espresso",320.0,125.33],["PD-100023","Colombia SPM(M)500g.","Espresso",475.0,266.61],["PD-100024","Colombia SPM(M)1 kg.","Espresso",950.0,533.21],["PD-100025","Colombia SPM(MD)200g","Espresso",320.0,125.33],["PD-100026","Colombia SPM(MD)500g","Espresso",475.0,266.61],["PD-100027","Colombia SPM(MD)1 kg","Espresso",950.0,533.21],["PD-100028","Fighter 222 250g.","Espresso",210.0,91.58],["PD-100029","Fighter 222 500g.","Espresso",300.0,199.11],["PD-100030","Fighter 222 1 kg.","Espresso",600.0,398.21],["PD-100031","Fighter 228 250g.","Espresso",210.0,91.58],["PD-100032","Fighter 228 500g.","Espresso",300.0,199.11],["PD-100033","Fighter 228 1 kg.","Espresso",600.0,398.21],["PD-100034","Fighter 237 250g.","Espresso",210.0,91.58],["PD-100035","Fighter 237 500g.","Espresso",300.0,199.11],["PD-100036","Fighter 237 1 kg.","Espresso",600.0,398.21],["PD-100037","Full Moon 250g.","Espresso",320.0,113.92],["PD-100038","Full Moon 500g.","Espresso",450.0,236.8],["PD-100039","Full Moon 1 kg.","Espresso",900.0,473.59],["PD-100040","HB Fluffy 250g.","Espresso",310.0,121.03],["PD-100041","HB Fluffy 500g.","Espresso",485.0,258.01],["PD-100042","HB Fluffy 1 kg.","Espresso",970.0,516.02],["PD-100043","HB Jennie 250g.","Espresso",390.0,142.91],["PD-100044","HB Jennie 500g.","Espresso",600.0,301.76],["PD-100045","HB Jennie 1 kg.","Espresso",1200.0,603.52],["PD-100046","KTT 250g.","Espresso",325.0,105.95],["PD-100047","KTT 500g.","Espresso",450.0,227.86],["PD-100048","KTT 1 kg.","Espresso",900.0,455.71],["PD-100049","Lao 222 250g.","Espresso",220.0,98.77],["PD-100050","Lao 222 500g.","Espresso",350.0,213.48],["PD-100051","Lao 222 1 kg.","Espresso",700.0,426.96],["PD-100052","Lao 228 250g.","Espresso",220.0,98.77],["PD-100053","Lao 228 500g.","Espresso",350.0,213.48],["PD-100054","Lao 228 1 kg.","Espresso",700.0,426.96],["PD-100055","Lao 233 250g.","Espresso",220.0,98.77],["PD-100056","Lao 233 500g.","Espresso",350.0,213.48],["PD-100057","Lao 233 1 kg.","Espresso",700.0,426.96],["PD-100058","MBY (Yor-Chue) 250g.","Espresso",270.0,102.44],["PD-100059","MBY (Yor-Chue) 500g.","Espresso",375.0,220.83],["PD-100060","MBY (Yor-Chue) 1 kg.","Espresso",750.0,441.65],["PD-100061","MBY (Yor-Ta) 250g.","Espresso",270.0,102.44],["PD-100062","MBY (Yor-Ta) 500g.","Espresso",375.0,220.83],["PD-100063","MBY (Yor-Ta) 1 kg.","Espresso",750.0,441.65],["PD-100064","MBY 3 King 250g.","Espresso",330.0,111.27],["PD-100065","MBY 3 King 500g.","Espresso",450.0,238.48],["PD-100066","MBY 3 King 1 kg.","Espresso",900.0,476.96],["PD-100067","Milk Choc 250g.","Espresso",260.0,105.64],["PD-100068","Milk Choc 500g.","Espresso",375.0,227.23],["PD-100069","Milk Choc 1 kg.","Espresso",750.0,454.46],["PD-100070","Milk's Father 250g.","Espresso",290.0,105.02],["PD-100071","Milk's Father 500g.","Espresso",425.0,225.98],["PD-100072","Milk's Father 1 kg.","Espresso",850.0,451.96],["PD-100073","Omkoi Washเข้ม 250g.","Espresso",370.0,119.08],["PD-100074","Omkoi Washเข้ม 500g.","Espresso",495.0,254.11],["PD-100075","Omkoi Washเข้ม 1 kg.","Espresso",990.0,508.21],["PD-100076","Omkoi Washกลาง 250g.","Espresso",370.0,119.08],["PD-100077","Omkoi Washกลาง 500g.","Espresso",495.0,254.11],["PD-100078","Omkoi Washกลาง 1kg.","Espresso",990.0,508.21],["PD-100079","Peanut Butter 250g.","Espresso",310.0,120.33],["PD-100080","Peanut Butter 500g.","Espresso",485.0,256.61],["PD-100081","Peanut Butter 1 kg.","Espresso",970.0,513.21],["PD-100082","Sammuen MD 250g.","Espresso",350.0,115.95],["PD-100083","Sammuen MD 500g.","Espresso",450.0,247.86],["PD-100084","Sammuen MD 1 kg.","Espresso",900.0,495.71],["PD-100085","Sammuen Medium 250g.","Espresso",350.0,115.95],["PD-100086","Sammuen Medium 500g.","Espresso",450.0,247.86],["PD-100087","Sammuen Medium 1 kg.","Espresso",900.0,495.71],["PD-100088","Spartan 222 250g.","Espresso",210.0,99.08],["PD-100089","Spartan 222 500g.","Espresso",300.0,214.11],["PD-100090","Spartan 222 1 kg.","Espresso",600.0,428.21],["PD-100091","Spartan 228 250g.","Espresso",210.0,99.08],["PD-100092","Spartan 228 500g.","Espresso",300.0,214.11],["PD-100093","Spartan 228 1 kg.","Espresso",600.0,428.21],["PD-100094","Spartan 233 250g.","Espresso",210.0,99.08],["PD-100095","Spartan 233 500g.","Espresso",300.0,214.11],["PD-100096","Spartan 233 1 kg.","Espresso",600.0,428.21],["PD-100097","The Slowly 216 250g.","Espresso",230.0,105.64],["PD-100098","The Slowly 216 500g.","Espresso",350.0,227.23],["PD-100099","The Slowly 216 1 kg.","Espresso",700.0,454.46],["PD-100100","The Slowly 222 250g.","Espresso",230.0,105.64],["PD-100101","The Slowly 222 500g.","Espresso",350.0,227.23],["PD-100102","The Slowly 222 1 kg.","Espresso",700.0,454.46],["PD-100103","The Slowly 228 250g.","Espresso",230.0,105.64],["PD-100104","The Slowly 228 500g.","Espresso",350.0,227.23],["PD-100105","The Slowly 228 1 kg.","Espresso",700.0,454.46],["PD-100106","ดอยช้าง212 250g.","Espresso",290.0,106.58],["PD-100107","ดอยช้าง212 500g.","Espresso",370.0,229.11],["PD-100108","ดอยช้าง212 1 kg.","Espresso",740.0,458.21],["PD-100109","ดอยช้าง222 250g.","Espresso",290.0,106.58],["PD-100110","ดอยช้าง222 500g.","Espresso",370.0,229.11],["PD-100111","ดอยช้าง222 1 kg.","Espresso",740.0,458.21],["PD-100112","ดอยช้าง228 250g.","Espresso",290.0,106.58],["PD-100113","ดอยช้าง228 500g.","Espresso",370.0,229.11],["PD-100114","ดอยช้าง228 1 kg.","Espresso",740.0,458.21],["PD-100115","สู่สุขคติ 237 250g.","Espresso",210.0,82.2],["PD-100116","สู่สุขคติ 237 500g.","Espresso",300.0,180.36],["PD-100117","สู่สุขคติ 237 1 kg.","Espresso",600.0,360.71],["PD-100118","Colombia Chiroso100g","Filter",500.0,176.52],["PD-100119","Colombia Chiroso200g","Filter",990.0,344.89],["PD-100120","Sammuen Washed 200g.","Filter",300.0,56.27],["PD-100121","MBY Fully Washed200g","Filter",320.0,104.39],["PD-100122","MBY Honey 200g.","Filter",335.0,105.64],["PD-100123","MBY Natural 200g.","Filter",420.0,105.64],["PD-100124","ภูฟ้า Natural 200g.","Filter",220.0,74.39],["PD-100125","Omkoiโฆ๊ะผะโด๊ะ 200g","Filter",275.0,106.89],["PD-100126","Omkoi Honey 200g.","Filter",290.0,111.89],["PD-100127","Omkoi Red Honey 200g","Filter",325.0,126.89],["PD-100128","Omkoi Wased 200g.","Filter",275.0,106.89],["PD-100129","Hojicha 50g.","Non-Coffee",160.0,82.3],["PD-100130","Hojicha 100g.","Non-Coffee",290.0,159.4],["PD-100131","Hojicha 200g.","Non-Coffee",570.0,313.59],["PD-100132","Hojicha 500g.","Non-Coffee",1300.0,780.55],["PD-100133","Kyoto 50g.","Non-Coffee",260.0,93.54],["PD-100134","Kyoto 100g.","Non-Coffee",490.0,181.89],["PD-100135","Kyoto 200g.","Non-Coffee",950.0,358.59],["PD-100136","Kyoto 500g.","Non-Coffee",2300.0,893.05],["PD-100137","Kyoto 1kg.","Non-Coffee",4600.0,1767.0],["PD-100138","Shizuoka 50g.","Non-Coffee",260.0,92.05],["PD-100139","Shizuoka 100g.","Non-Coffee",490.0,184.1],["PD-100140","Shizuoka 200g.","Non-Coffee",950.0,372.83],["PD-100141","Shizuoka 500g.","Non-Coffee",2300.0,929.49],["PD-100142","Shizuoka 1kg.","Non-Coffee",4600.0,1841.0],["PD-100143","แบล็คโกโก้ 200g.","Non-Coffee",155.0,86.53],["PD-100144","แบล็คโกโก้ 500g.","Non-Coffee",330.0,213.73],["PD-100145","แบล็คโกโก้ 1kg.","Non-Coffee",660.0,409.48],["PD-100146","โกโก้สูตร1 200g.","Non-Coffee",160.0,104.83],["PD-100147","โกโก้สูตร1 500g.","Non-Coffee",350.0,259.49],["PD-100148","โกโก้สูตร1 1kg.","Non-Coffee",700.0,501.0],["PD-100149","โกโก้สูตร2 200g.","Non-Coffee",165.0,107.61],["PD-100150","โกโก้สูตร2 500g.","Non-Coffee",355.0,266.44],["PD-100151","โกโก้สูตร2 1kg.","Non-Coffee",710.0,514.9],["PD-100152","โกโก้สูตร3 200g.","Non-Coffee",150.0,70.23],["PD-100153","โกโก้สูตร3 500g.","Non-Coffee",315.0,172.99],["PD-100154","โกโก้สูตร3 1kg.","Non-Coffee",630.0,328.0],["PD-100155","โกโก้สูตร4 200g.","Non-Coffee",120.0,57.23],["PD-100156","โกโก้สูตร4 500g.","Non-Coffee",245.0,140.49],["PD-100157","โกโก้สูตร4 1kg.","Non-Coffee",490.0,263.0],["PD-100158","โกโก้สูตร5 200g.","Non-Coffee",155.0,98.63],["PD-100159","โกโก้สูตร5 500g.","Non-Coffee",335.0,243.99],["PD-100160","โกโก้สูตร5 1kg.","Non-Coffee",670.0,470.0],["PD-100161","ชาเขียวมะลิใส 100g.","Non-Coffee",150.0,54.5],["PD-100162","ชาเขียวมะลิใส 500g.","Non-Coffee",275.0,155.0],["PD-100163","ชาเขียวมะลินม 200g.","Non-Coffee",110.0,56.27],["PD-100164","ชาเขียวมะลินม 500g.","Non-Coffee",225.0,138.09],["PD-100165","ชาเขียวมะลินม 1 kg.","Non-Coffee",450.0,258.2],["PD-100166","ชาไทย(1) 200g.","Non-Coffee",100.0,33.63],["PD-100167","ชาไทย(1) 500g.","Non-Coffee",200.0,81.49],["PD-100168","ชาไทย(1) 1kg.","Non-Coffee",400.0,145.0],["PD-100169","ชาไทย(2) 200g.","Non-Coffee",100.0,38.94],["PD-100170","ชาไทย(2) 500g.","Non-Coffee",200.0,94.77],["PD-100171","ชาไทย(2) 1kg.","Non-Coffee",400.0,171.56],["PD-100172","ชาดำอัสสัม 200g.","Non-Coffee",165.0,58.63],["PD-100173","ชาดำอัสสัม 500g.","Non-Coffee",225.0,143.99],["PD-100174","ชาบาบูตง200gสูตรใหม่","Non-Coffee",80.0,24.94],["PD-100175","ชาบาบูตง500gสูตรเก่า","Non-Coffee",140.0,66.77],["PD-100176","ชาบาบูตง500gสูตรใหม่","Non-Coffee",140.0,59.77],["PD-100177","ชาบาบูตง1kg.สูตรเก่า","Non-Coffee",280.0,115.56],["PD-100178","ชาบาบูตง1kg.สูตรใหม่","Non-Coffee",280.0,101.56],["PD-100179","ชามะนาว3in1 500g.","Non-Coffee",140.0,66.77],["PD-100180","ชามะนาว3in1 1 kg.","Non-Coffee",240.0,115.56],["PD-100181","ชาอินโดOriginal500g.","Non-Coffee",110.0,47.77],["PD-100182","ชาอินโดOriginal1kg.","Non-Coffee",220.0,77.56],["PD-100183","ชาอินโดPremium 500g.","Non-Coffee",140.0,66.77],["PD-100184","ชาอินโดPremium1kg.","Non-Coffee",280.0,115.56],["PD-100185","GBสามหมื่นNatural1kg","Green Bean",430.0,347.15],["PD-100186","GB Brazil Cerrado1kg","Green Bean",420.0,307.15],["PD-100187","GB Brazil santos 1kg","Green Bean",420.0,307.15],["PD-100188","GB ปางขอน Fully 2","Green Bean",430.0,242.15],["PD-100189","GB ปางขอน Fully1","Green Bean",430.0,242.15],["PD-100190","GB ปางขอน Honey 1kg.","Green Bean",405.0,312.153],["PD-100191","GBปางขอนNatura 1kg.","Green Bean",450.0,352.15],["PD-100192","GB Omkoi Honey 1 kg.","Green Bean",470.0,377.15],["PD-100193","GB Omkoi RedHoney1kg","Green Bean",535.0,437.15],["PD-100194","GB Omkoi Wash 1 kg.","Green Bean",440.0,357.15],["PD-100195","GB OmkoiWashโฆ๊ะ 1kg","Green Bean",440.0,357.15],["PD-100196","GB สามหมื่น Peaberry","Green Bean",430.0,347.15],["PD-100197","GB สามหมื่น Wash (A)","Green Bean",430.0,347.15],["PD-100198","GB สามหมื่น Wash (B)","Green Bean",430.0,347.15],["PD-100199","Dripbag Setกาแฟ(ถุง)","Dripbag Coffee",350.0,125.5],["PD-100200","Dripbag 3 King","Dripbag Coffee",40.0,10.54],["PD-100201","Dripbag Fighter237","Dripbag Coffee",40.0,9.61],["PD-100202","Dripbag KTT Blend","Dripbag Coffee",40.0,11.28],["PD-100203","Dripbag Lao 228","Dripbag Coffee",40.0,9.58],["PD-100204","Dripbag MBY Honey","Dripbag Coffee",40.0,10.79],["PD-100205","Dripbag MBY Natural","Dripbag Coffee",40.0,11.19],["PD-100206","Dripbag MBY Washed","Dripbag Coffee",40.0,10.01],["PD-100207","Dripbag Milk Choc","Dripbag Coffee",40.0,10.09],["PD-100208","Dripbag Slowly222","Dripbag Coffee",40.0,9.93],["PD-100209","Dripbag Spartan222","Dripbag Coffee",40.0,9.56],["PD-100210","Dripbag Spartan228","Dripbag Coffee",40.0,9.58],["PD-100211","Dripbag ภูฟ้า","Dripbag Coffee",40.0,9.78],["PD-100212","Dripbag สู่สุขคติ237","Dripbag Coffee",40.0,9.51],["PD-100213","Dripbag อมก๋อย Wash","Dripbag Coffee",40.0,11.24],["PD-100214","DripbagBYBerryVillag","Dripbag Coffee",40.0,11.75],["PD-100215","ชะลอมหูหิ้วกาแฟ10ซอง","Dripbag Coffee",450.0,142.5],["PD-100216","Dripbag Set ชา(ถุง)","Dripbag Non Coffee",270.0,76.5],["PD-100217","Dripbag ชา 3ช่า","Dripbag Non Coffee",30.0,5.99],["PD-100218","Dripbag ชาไทย สูตร1","Dripbag Non Coffee",30.0,6.76],["PD-100219","Dripbag ชาไทย สูตร2","Dripbag Non Coffee",30.0,7.12],["PD-100220","Dripbag ชาดำ","Dripbag Non Coffee",30.0,7.25],["PD-100221","Dripbagชาเขียวมะลิใส","Dripbag Non Coffee",30.0,6.1],["PD-100222","Dripbagชาเขียวมะลินม","Dripbag Non Coffee",30.0,7.0],["PD-100223","ชะลอมตลับชา 10ซอง","Dripbag Non Coffee",350.0,97.5],["PD-100224","Capsule KTT Blend","Capsules Coffee",248.0,137.08],["PD-100225","Capsule Lao228","Capsules Coffee",248.0,65.95],["PD-100226","Capsule MBY Yor-Chue","Capsules Coffee",248.0,136.23],["PD-100227","Capsule Milk'sFather","Capsules Coffee",248.0,136.85],["PD-100228","Capsule SET (รวมรส)","Capsules Coffee",248.0,137.08],["PD-100229","Capsule Slowly222","Capsules Coffee",248.0,137.0],["PD-100230","Capsule Spartan222","Capsules Coffee",248.0,66.03],["PD-100231","Capsule ภูฟ้า Natura","Capsules Coffee",248.0,61.08],["PD-100232","Capsule อมก๋อย Wash","Capsules Coffee",248.0,70.83],["PD-100233","SET30Cap KTT Blend","Capsules Coffee",660.0,387.97],["PD-100234","SET30Cap Milk's Fath","Capsules Coffee",660.0,387.29],["PD-100235","SET30Cap The Slowly","Capsules Coffee",660.0,387.74],["PD-100236","SET30Cap Yor-Chue","Capsules Coffee",660.0,385.43],["PD-100237","50Cap(2รสชาติ)ทักแชท","Capsules Coffee",999.0,638.38],["PD-100238","Capsules ชาเขียวมะลิ","Capsules Non-Coffee",148.0,51.2],["PD-100239","Capsules ชาไทย","Capsules Non-Coffee",148.0,47.0],["PD-100240","Capsules ชาดำ","Capsules Non-Coffee",148.0,52.0],["PD-100241","Capsules ชาพีช","Capsules Non-Coffee",148.0,55.2],["PD-100242","Capsules มัทฉะ","Capsules Non-Coffee",148.0,58.9],["PD-100243","พร้อมดื่มLight Fruit","Cold Brew",70.0,20.08],["PD-100244","Light Fruit 200ml","Cold Brew",100.0,20.05],["PD-100245","Light Fruit 500ml","Cold Brew",150.0,53.49],["PD-100246","Light Fruit 1000ml.","Cold Brew",250.0,96.29],["PD-100247","Light Fruit 5000ml","Cold Brew",850.0,434.39],["PD-100248","พร้อมดื่มMedium Choc","Cold Brew",70.0,21.38],["PD-100249","Medium Choc 200ml","Cold Brew",100.0,21.34],["PD-100250","Medium Choc 500ml","Cold Brew",150.0,56.73],["PD-100251","Medium Choc 1000ml.","Cold Brew",250.0,102.76],["PD-100252","Medium Choc 5000ml","Cold Brew",850.0,466.71],["PD-100253","พร้อมดื่มDark Choc","Cold Brew",70.0,22.62],["PD-100254","Dark Choc 200ml","Cold Brew",100.0,22.59],["PD-100255","Dark Choc 500ml","Cold Brew",150.0,59.84],["PD-100256","Dark Choc 1000ml.","Cold Brew",250.0,108.99],["PD-100257","Dark Choc 5000ml","Cold Brew",850.0,497.89],["PD-100258","พร้อมดื่มFloral","Cold Brew",70.0,20.3],["PD-100259","Floral 200ml.","Cold Brew",100.0,20.27],["PD-100260","Floral 500ml","Cold Brew",150.0,54.03],["PD-100261","Floral 1000ml.","Cold Brew",250.0,97.37],["PD-100262","พร้อมดื่มHoneyLemon","Cold Brew",70.0,26.3],["PD-100263","Honey Lemon 200ml","Cold Brew",100.0,26.27],["PD-100264","Honey Lemon 500ml","Cold Brew",220.0,69.03],["PD-100265","Honey Lemon 1000ml.","Cold Brew",330.0,127.37],["PD-100266","พร้อมดื่มBerry","Cold Brew",70.0,20.89],["PD-100267","Berry Forest 200ml","Cold Brew",100.0,20.86],["PD-100268","Berry Forest 500ml","Cold Brew",220.0,55.52],["PD-100269","Berry Forest 1000ml.","Cold Brew",330.0,100.34],["PD-100270","พร้อมดื่มToffee","Cold Brew",70.0,22.03],["PD-100271","Toffee Caramel 200ml","Cold Brew",100.0,21.99],["PD-100272","Toffee Caramel 500ml","Cold Brew",220.0,58.35],["PD-100273","Toffee Caramel1000ml","Cold Brew",330.0,106.0],["PD-100274","Samui 200ml","Cold Brew",100.0,22.66],["PD-100275","Samui 500ml","Cold Brew",220.0,60.03],["PD-100276","Samui 1000ml.","Cold Brew",330.0,109.36],["PD-100277","Blush Fusion 200ml","Cold Brew",100.0,20.7],["PD-100278","Blush Fusion 500ml","Cold Brew",220.0,55.11],["PD-100279","Blush Fusion 1000ml.","Cold Brew",330.0,99.53],["PD-100280","Tom Yum 200ml","Cold Brew",100.0,24.49],["PD-100281","Tom Yum 500ml","Cold Brew",220.0,64.59],["PD-100282","Tom Yum 1000ml.","Cold Brew",330.0,118.49],["PD-100283","พร้อมดื่มคละรส 7ขวด,กระเป๋าเก็บความเย็น","Cold Brew",490.0,167.84],["PD-100284","Tattoo รวมผี","Free Gift",35.0,14.5],["PD-100285","Roaster,Black ดำ","Coffee Machine",28900.0,0.0],["PD-100286","Roaster,Red แดง","Coffee Machine",28900.0,0.0],["PD-100287","Roaster+Cooling Tray,Black ดำ","Coffee Machine",33000.0,0.0],["PD-100288","Roaster+Cooling Tray,Red แดง","Coffee Machine",33000.0,0.0],["PD-100289","DUOMO สีขาว","Accessories",7400.0,5900.0],["PD-100290","DUOMO สีดำ","Accessories",6100.0,4900.0],["PD-100291","Force Tamper เงินเงา","Accessories",6155.0,4900.0],["PD-100292","Force Tamper เงินแมท","Accessories",6155.0,4900.0],["PD-100293","Force Tamper ลายไม้","Accessories",6155.0,4900.0],["PD-100294","Force Tamper สีดำ","Accessories",6155.0,4900.0],["PD-100295","Force Tamper สีดำเงา","Accessories",6155.0,4900.0],["PD-100296","Light Fruit 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100297","Light Fruit 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100298","Light Fruit 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100299","Light Fruit 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100300","Light Fruit 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100301","Light Fruit 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100302","Light Fruit 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100303","Medium Choc 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100304","Medium Choc 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100305","Medium Choc 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100306","Medium Choc 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100307","Medium Choc 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100308","Medium Choc 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100309","Medium Choc 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100310","Dark Choc 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100311","Dark Choc 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100312","Dark Choc 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100313","Dark Choc 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100314","Dark Choc 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100315","Dark Choc 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100316","Dark Choc 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100317","Floral 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100318","Floral 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100319","Floral 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100320","Floral 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100321","Floral 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100322","Floral 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100323","Floral 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100324","Honey Lemon 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100325","Honey Lemon 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100326","Honey Lemon 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100327","Honey Lemon 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100328","Honey Lemon 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100329","Honey Lemon 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100330","Honey Lemon 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100331","Berry Forest 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100332","Berry Forest 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100333","Berry Forest 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100334","Berry Forest 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100335","Berry Forest 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100336","Berry Forest 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100337","Berry Forest 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100338","Toffee Caramel1000ml,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100339","Toffee Caramel1000ml,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100340","Toffee Caramel1000ml,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100341","Toffee Caramel1000ml,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100342","Toffee Caramel1000ml,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100343","Toffee Caramel1000ml,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100344","Toffee Caramel1000ml,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100345","Samui 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100346","Samui 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100347","Samui 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100348","Samui 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100349","Samui 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100350","Samui 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100351","Samui 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100352","Blush Fusion 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100353","Blush Fusion 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100354","Blush Fusion 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100355","Blush Fusion 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100356","Blush Fusion 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100357","Blush Fusion 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100358","Blush Fusion 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100359","Tom Yum 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100360","Tom Yum 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100361","Tom Yum 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100362","Tom Yum 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100363","Tom Yum 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100364","Tom Yum 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100365","Tom Yum 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100366","Medium Roast,30 กรัม","Accessories",415.0,0.0],["PD-100367","Medium Roast,60 กรัม","Accessories",795.0,0.0],["PD-100368","Medium Dark Roast,30 กรัม","Accessories",415.0,0.0],["PD-100369","Medium Dark Roast,60 กรัม","Accessories",795.0,0.0],["PD-100370","กส.รูปเสือ เล็ก","Accessories",150.0,0.0],["PD-100371","กส.กระสอบเปล่า","Accessories",65.0,0.0],["PD-100372","กส.THAI ม่วง","Accessories",250.0,0.0],["PD-100373","กส.ตัวหนังสือ","Accessories",150.0,0.0],["PD-100374","กส.Lao","Accessories",250.0,0.0],["PD-100375","กส.ตัวหนังสือครึ่ง","Accessories",250.0,0.0],["PD-100376","กส.รูปเสือ ใหญ่","Accessories",250.0,0.0],["PD-100377","กส.รูปกบ ใหญ่","Accessories",250.0,0.0],["PD-100378","กส.รูปช้าง","Accessories",120.0,0.0],["PD-100379","กส.รูปม้าลาย","Accessories",150.0,0.0],["PD-100380","ORGM Ceramic ชมพู,M","Accessories",1050.0,873.12],["PD-100381","ORGM Ceramic เหลือง,S","Accessories",980.0,864.25],["PD-100382","ORGMCeramicMattGreen,M","Accessories",1050.0,873.12],["PD-100383","ORGM Ceramic ดำ,S","Accessories",980.0,864.25],["PD-100384","ORGM Ceramic Navy,S","Accessories",980.0,864.25],["PD-100385","ORGMCeramicMattBeige,S","Accessories",980.0,864.25],["PD-100386","ORGM Ceramic เขียว,S","Accessories",980.0,864.25],["PD-100387","ORGMCeramic White,M","Accessories",1050.0,873.12],["PD-100388","ORGM Ceramic ม่วง,M","Accessories",1050.0,873.12],["PD-100389","ORGM Ceramic Navy,M","Accessories",1050.0,873.12],["PD-100390","ORGMCeramicMatt Pink,M","Accessories",1050.0,873.12],["PD-100391","ORGM Ceramic ส้ม,M","Accessories",1050.0,873.12],["PD-100392","ORGMCeramicMattGrey,M","Accessories",1050.0,873.12],["PD-100393","ORGM Ceramic แดง,S","Accessories",980.0,864.25],["PD-100394","ORGMCeramicMatt Blue,M","Accessories",1050.0,873.12],["PD-100395","ORGM Ceramic น้ำตาล,S","Accessories",980.0,864.25],["PD-100396","ORGM Ceramic เหลือง,M","Accessories",1050.0,873.12],["PD-100397","ORGMCeramicMattGrey,S","Accessories",980.0,864.25],["PD-100398","ORGMCeramicMatt Blue,S","Accessories",980.0,864.25],["PD-100399","ORGM Ceramic เขียว,M","Accessories",1050.0,873.12],["PD-100400","ORGM Ceramic ม่วง,S","Accessories",980.0,864.25],["PD-100401","ORGM Ceramic ส้ม,S","Accessories",980.0,864.25],["PD-100402","ORGM Ceramic น้ำตาล,M","Accessories",1050.0,873.12],["PD-100403","ORGMCeramicMattGreen,S","Accessories",980.0,864.25],["PD-100404","ORGM Ceramic แดง,M","Accessories",1050.0,873.12],["PD-100405","ORGM Ceramic ชมพู,S","Accessories",980.0,864.25],["PD-100406","ORGM Ceramic ฟ้าคราม,M","Accessories",1050.0,873.12],["PD-100407","ORGM Ceramic ฟ้าคราม,S","Accessories",980.0,864.25],["PD-100408","ORGMCeramicMattBeige,M","Accessories",1050.0,873.12],["PD-100409","ORGM Ceramic ดำ,M","Accessories",1050.0,873.12],["PD-100410","ORGMCeramic White,S","Accessories",980.0,864.25],["PD-100411","ORGMCeramicMatt Pink,S","Accessories",980.0,864.25],["PD-100412","BY Berry Village200g","Accessories",790.0,118.14],["PD-100413","FelicitaParallelPlus","Accessories",3900.0,2700.0],["PD-100414","ฐาน Ripple 58.35 mm.","Accessories",810.0,500.0],["PD-100415","ฐาน Flat 58.50 mm.","Accessories",810.0,500.0],["PD-100416","ฐาน Waffle 58.50 mm.","Accessories",1070.0,750.0],["PD-100417","ฐาน Waffle 58.35 mm.","Accessories",1070.0,750.0],["PD-100418","ฐาน Ripple 58.50 mm.","Accessories",810.0,500.0],["PD-100419","CAFEC T-92 4CUP","Accessories",180.0,115.0],["PD-100420","CAFEC T-92 1CUP","Accessories",160.0,105.0],["PD-100421","CAFEC T-83 4CUP","Accessories",180.0,115.5],["PD-100422","CAFEC T-83 1CUP","Accessories",160.0,105.0],["PD-100423","CAFEC T-90 4CUP","Accessories",180.0,115.5],["PD-100424","CAFEC T-90 1CUP","Accessories",160.0,105.0],["PD-100425","ยางซิลิโคน สีเขียว","Accessories",740.0,385.0],["PD-100426","ยางซิลิโคน สีชมพู","Accessories",740.0,385.0],["PD-100427","ยางซิลิโคน สีดำ","Accessories",740.0,385.0],["PD-100428","ยางซิลิโคน สีเหลือง","Accessories",740.0,385.0],["PD-100429","Dripper ใส 1CUP","Accessories",280.0,225.0],["PD-100430","Dripper ใส 4CUP","Accessories",320.0,250.0],["PD-100431","แก้วตวง","Free Gift",0.0,3.81],["PD-100432","ถุงเก็บความเย็น","Free Gift",0.0,11.77],["PD-100433","Maejantai 100g.","Filter",400.0,177.27],["PD-100434","Maejantai 200g.","Filter",780.0,346.39],["PD-100435","Panama Geisha 50g.","Filter",700.0,330.87],["PD-100436","Panama Geisha 100g.","Filter",1250.0,650.64],["PD-100437","Panama Geisha 200g.","Filter",2400.0,1293.14],["PD-100438","ช้อนตวง ตักกาแฟแบบ 2 in 1","Accessories",35.0,0.0],["PD-100439","เครื่องแคปซูล (ขาว)","Accessories",2500.0,1878.24],["PD-100440","FelicitaParalleScale","Accessories",3400.0,2200.0],["PD-100441","Felicita Oval Black","Accessories",14900.0,9500.0],["PD-100442","Felicita Oval White","Accessories",14900.0,9500.0],["PD-100443","Arco 2in1 Grinder","Accessories",19900.0,12000.0],["PD-100444","Arco Hand Grinder","Accessories",8900.0,6000.0],["PD-100445","Grinder Clean 450g.","Accessories",1460.0,976.5],["PD-100446","FLAT FAST M 50 แผ่น","Accessories",970.0,648.78],["PD-100447","FLAT FAST M 100 แผ่น","Accessories",1620.0,1077.32],["PD-100448","FLAT FAST M 25 แผ่น","Accessories",640.0,426.83],["PD-100449","CONE FAST XL,100","Accessories",1920.0,1281.33],["PD-100450","CONE FAST M,50","Accessories",970.0,648.78],["PD-100451","CONE FAST XL,25","Accessories",760.0,1077.32],["PD-100452","CONE FAST S,25","Accessories",640.0,426.83],["PD-100453","CONE FAST S,50","Accessories",970.0,648.78],["PD-100454","CONE FAST XL,50","Accessories",970.0,771.26],["PD-100455","CONE FAST S,100","Accessories",1620.0,1280.33],["PD-100456","CONE FAST M,100","Accessories",1620.0,1077.32],["PD-100457","CONE FAST M,25","Accessories",640.0,426.83],["PD-100458","ESPRESSO SOFT FILTER","Accessories",600.0,398.32],["PD-100459","ESPRESSO HIGH CELLUL","Accessories",700.0,468.88],["PD-100460","ESPRESSO HIGH MEMBRA","Accessories",900.0,597.93],["PD-100461","CAFEC Abaca 4CUP","Accessories",195.0,126.0],["PD-100462","CAFEC Abaca 1CUP","Accessories",175.0,112.0],["PD-100463","Felicita ARC","Accessories",4560.0,3300.0],["PD-100464","ชาพีช 500g.","Non-Coffee",130.0,98.99],["PD-100465","ชาพีช 1kg.","Non-Coffee",260.0,180.0],["PD-100466","Doi Pangkhon 500g.","Espresso",342.5,0.0],["PD-100467","Doi Pangkhon (Yor-Chue) 500g.","Espresso",375.0,220.83],["PD-100468","Doi Pangkhon (Yor-Ta) 500g.","Espresso",375.0,220.83],["PD-100469","Milk Choc 1kg. (Nologo)","Espresso",750.0,454.46],["PD-100470","House Blend 500g. (Nologo)","Espresso",300.0,0.0],["PD-100471","Special Blend 500g. (Nologo)","Espresso",375.0,0.0],["PD-100472","บ้านค่าย 500g.","Espresso",360.0,209.73],["PD-100473","บางบุตร 500g.","Espresso",400.0,0.0],["PD-100474","ชากมะหาด 500g.","Espresso",400.0,0.0],["PD-100475","ระยองเบลนด์ 500g.","Espresso",300.0,214.11],["PD-100476","Mae Buh Yah 209 500g. (Nologo)","Espresso",375.0,0.0],["PD-100477","Lao 236 500g. (Nologo)","Espresso",375.0,0.0],["PD-100478","Robusta 245 500g. (Nologo)","Espresso",275.0,0.0],["PD-100479","Early Bird 1kg. (Nologo)","Espresso",490.0,0.0],["PD-100480","ชาไทย(1) 1kg. (Nologo)","Non-Coffee",0.0,0.0],["PD-100481","Nishio Matcha 50g.","Non-Coffee",205.0,103.62],["PD-100482","Nishio Matcha 100g.","Non-Coffee",380.0,196.12],["PD-100483","Nishio Matcha 200g.","Non-Coffee",730.0,385.74],["PD-100484","Nishio Matcha 500g.","Non-Coffee",1750.0,964.77],["PD-100485","Nishio Matcha 1kg","Non-Coffee",3500.0,1905.56],["PD-100486","Mie Matcha 30g.","Non-Coffee",420.0,250.97],["PD-100487","Mie Matcha 50g.","Non-Coffee",520.0,336.15],["PD-100488","Mie Matcha 100g.","Non-Coffee",1010.0,666.74],["PD-100489","Mie Matcha 200g.","Non-Coffee",1990.0,1332.54],["PD-100490","Mie Matcha 500g.","Non-Coffee",4900.0,3328.7],["PD-100491","Mie Matcha 1kg.","Non-Coffee",9800.0,6639.56],["PD-100492","Light Fruit 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100493","Light Fruit 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100494","Light Fruit 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100495","Light Fruit 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100496","Light Fruit 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100497","Light Fruit 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100498","Light Fruit 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100499","Medium Choc 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100500","Medium Choc 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100501","Medium Choc 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100502","Medium Choc 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100503","Medium Choc 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100504","Medium Choc 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100505","Medium Choc 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100506","Dark Choc 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100507","Dark Choc 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100508","Dark Choc 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100509","Dark Choc 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100510","Dark Choc 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100511","Dark Choc 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100512","Dark Choc 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100513","Floral 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100514","Floral 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100515","Floral 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100516","Floral 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100517","Floral 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100518","Floral 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100519","Floral 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100520","Honey Lemon 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100521","Honey Lemon 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100522","Honey Lemon 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100523","Honey Lemon 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100524","Honey Lemon 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100525","Honey Lemon 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100526","Honey Lemon 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100527","Berry Forest 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100528","Berry Forest 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100529","Berry Forest 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100530","Berry Forest 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100531","Berry Forest 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100532","Berry Forest 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100533","Berry Forest 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100534","Toffee Caramel1000ml,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100535","Toffee Caramel1000ml,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100536","Toffee Caramel1000ml,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100537","Toffee Caramel1000ml,Floral 200ml.","Promotion",380.0,153.63],["PD-100538","Toffee Caramel1000ml,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100539","Toffee Caramel1000ml,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100540","Toffee Caramel1000ml,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100541","Samui 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100542","Samui 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100543","Samui 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100544","Samui 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100545","Samui 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100546","Samui 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100547","Samui 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100548","Blush Fusion 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100549","Blush Fusion 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100550","Blush Fusion 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100551","Blush Fusion 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100552","Blush Fusion 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100553","Blush Fusion 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100554","Blush Fusion 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100555","Tom Yum 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100556","Tom Yum 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100557","Tom Yum 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100558","Tom Yum 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100559","Tom Yum 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100560","Tom Yum 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100561","Tom Yum 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100562","Mascarada Panama100g","Filter",690.0,250.64],["PD-100563","Mascarada Panama200g","Filter",1200.0,493.14],["PD-100564","แสงสว่าง 500g.","Espresso",300.0,214.11],["PD-100565","ดอยแม่สลอง 100g.","Filter",170.0,49.39],["PD-100566","ดอยแม่สลอง 200g.","Filter",300.0,90.64],["PD-100567","ดอยแม่สลอง M 250g.","Espresso",290.0,98.77],["PD-100568","ดอยแม่สลอง M 500g.","Espresso",370.0,213.48],["PD-100569","ดอยแม่สลอง M 1kg.","Espresso",740.0,426.96],["PD-100570","ดอยแม่สลอง MD 250g.","Espresso",290.0,98.77],["PD-100571","ดอยแม่สลอง MD 500g.","Espresso",370.0,213.48],["PD-100572","ดอยแม่สลอง MD 1kg.","Espresso",740.0,426.96],["PD-100573","พร้อมดื่มBZ Light","Cold Brew",70.0,22.32],["PD-100574","Brazil Light 200ml","Cold Brew",100.0,22.29],["PD-100575","Brazil Light 500ml","Cold Brew",220.0,59.08],["PD-100576","Brazil Light 1000ml","Cold Brew",330.0,107.47],["PD-100577","Brazil Light 5000ml","Cold Brew",1155.0,453.29],["PD-100578","พร้อมดื่มBZ Medium","Cold Brew",70.0,22.32],["PD-100579","Brazil  Medium 200ml","Cold Brew",100.0,22.29],["PD-100580","Brazil  Medium 500ml","Cold Brew",220.0,59.08],["PD-100581","Brazil  Medium 1000ml","Cold Brew",330.0,107.47],["PD-100582","Brazil  Medium 5000ml","Cold Brew",1155.0,453.29],["PD-100583","พร้อมดื่มBZ Dark","Cold Brew",70.0,22.34],["PD-100584","Brazil Dark 200ml","Cold Brew",100.0,22.3],["PD-100585","Brazil Dark 500ml","Cold Brew",220.0,59.12],["PD-100586","Brazil Dark 1000ml","Cold Brew",330.0,107.55],["PD-100587","Brazil Dark 5000ml","Cold Brew",1155.0,453.69],["PD-100588","มัทฉะแม่สลอง 100g","Non-Coffee",150.0,103.9],["PD-100589","มัทฉะแม่สลอง 200g","Non-Coffee",370.0,114.43],["PD-100590","มัทฉะแม่สลอง 500g","Non-Coffee",600.0,283.49],["PD-100591","มัทฉะแม่สลอง 1kg","Non-Coffee",1200.0,549.0],["PD-100592","กากกาแฟ 500g","nan",59.0,5.0],["PD-100593","กากกาแฟ 1kg","nan",89.0,10.0],["PD-100594","กากกาแฟ 5kg","nan",389.0,50.0],["PD-100595","Robusta Dark 500ml.","Cold Brew",150.0,0.0],["PD-100596","Robusta Dark 1000ml.","Cold Brew",250.0,0.0],["PD-100597","Robusta Dark 5000ml.","Cold Brew",1100.0,0.0]];
const PRMAP = {};
PR.forEach(p => { PRMAP[p[0]] = {sku:p[0],name:p[1],cat:p[2],sell:p[3],cost:p[4]}; });
const CATS = ['ทั้งหมด',...Array.from(new Set(PR.map(p=>p[2]))).sort()];
const CAT_LIST = Array.from(new Set(PR.map(p=>p[2]))).sort();

// ── Helpers ──────────────────────────────────────────────
const fmt   = n => Math.round(n).toLocaleString('th-TH');
const fmtD  = n => Number(n).toFixed(2);
const fmtPct= n => Number(n).toFixed(1)+'%';
const thDT  = d => new Date(d).toLocaleString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
const thDate= d => new Date(d).toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit'});
const TODAY = () => new Date().toDateString();
const MONTH = () => { const n=new Date(); return n.getMonth()+'-'+n.getFullYear(); };

function statType(qty,sf){ return qty===0?'out':qty<=sf?'low':'ok'; }
function statLabel(t){ return t==='out'?'❌ หมดสต็อก':t==='low'?'⚠️ ใกล้หมด':'✅ ปกติ'; }

// ── Styles ───────────────────────────────────────────────
const C = { dark:'#1B3A2D', mid:'#2D5C45', pale:'#EFF7F3', gold:'#A07820', white:'#fff',
            red:'#C0392B', green:'#1E8449', blue:'#0000CC', gray:'#666', amber:'#E65100' };

const css = {
  wrap: { maxWidth:1140, margin:'0 auto', padding:'0 10px 60px', fontFamily:"Arial,'Noto Sans Thai',sans-serif", fontSize:13 },
  hdr:  { background:C.dark, color:'#EFF7F3', padding:'11px 16px', borderRadius:10, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' },
  nav:  { display:'flex', gap:4, marginBottom:12, flexWrap:'wrap', paddingBottom:10, borderBottom:'1px solid #e0e0e0' },
  card: { background:'#fff', border:'1px solid #e0e0e0', borderRadius:10, padding:'1rem 1.25rem', marginBottom:12 },
  kgrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:12 },
  kcard:{ background:'#f5f5f5', borderRadius:8, padding:'12px 14px' },
  row:  { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  inp:  { padding:'7px 10px', border:'1px solid #ccc', borderRadius:6, fontSize:13, outline:'none', background:'#fff', color:'#1a1a1a' },
  tbl:  { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:   { background:C.dark, color:'#EFF7F3', padding:'7px 8px', textAlign:'left', fontWeight:500, whiteSpace:'nowrap' },
  tow:  { overflowX:'auto' },
};
const btn = (v='dk',extra={}) => {
  const m={dk:[C.dark,'#EFF7F3'],gr:[C.green,'#fff'],rd:[C.red,'#fff'],gy:['#888','#fff'],am:[C.amber,'#fff'],bl:['#1A5276','#fff']};
  const [bg,fg]=m[v]||m.dk;
  return { padding:'8px 16px',background:bg,color:fg,border:'none',borderRadius:6,fontWeight:500,cursor:'pointer',fontSize:13,...extra };
};
const nbtn = a => ({ padding:'7px 14px',borderRadius:6,border:'1px solid #ccc',background:a?'#e8e8e8':'transparent',fontWeight:a?500:400,cursor:'pointer',fontSize:13,color:'#1a1a1a' });
const tdc  = i => ({ padding:'6px 8px', borderBottom:'1px solid #eee', background:i%2===0?'#f9f9f9':'#fff' });
const bdg  = t => t==='out'
  ? {background:'#FADBD8',color:C.red,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:500,whiteSpace:'nowrap'}
  : t==='low'
  ? {background:'#FDEBD0',color:C.amber,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:500,whiteSpace:'nowrap'}
  : {background:'#D5F5E3',color:C.green,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:500,whiteSpace:'nowrap'};

// ════════════════════════════════════════════════════════
// EXPORT EXCEL (SheetJS)
// ════════════════════════════════════════════════════════
function useXLSX() {
  const [ready, setReady] = useState(false);
  useEffect(()=>{
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  },[]);
  return ready;
}

function exportXLSX(filename, sheets) {
  const wb = window.XLSX.utils.book_new();
  sheets.forEach(({name, data, headers}) => {
    const wsData = [headers, ...data];
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    // Style header row width
    const colWidths = headers.map(h => ({wch: Math.max(h.length*2, 12)}));
    ws['!cols'] = colWidths;
    window.XLSX.utils.book_append_sheet(wb, ws, name);
  });
  window.XLSX.writeFile(wb, filename);
}

// ════════════════════════════════════════════════════════
// MINI CHART (CSS bar chart, no library needed)
// ════════════════════════════════════════════════════════
function BarChart({ data, valueKey, labelKey, color='#1B3A2D', height=120 }) {
  const max = Math.max(...data.map(d=>d[valueKey]), 1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height,paddingTop:8}}>
      {data.map((d,i) => (
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <div style={{fontSize:9,color:'#888',textAlign:'center'}}>{fmt(d[valueKey])}</div>
          <div style={{width:'100%',background:color,borderRadius:'3px 3px 0 0',height:Math.max((d[valueKey]/max)*(height-24),2),transition:'height 0.3s'}} />
          <div style={{fontSize:9,color:'#666',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:50}}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════
function Dashboard({ stock, sales }) {
  const xlsxReady = useXLSX();

  const metrics = useMemo(() => {
    const stVal = PR.reduce((s,p)=>{ const d=stock[p[0]]||{qty:0,cost:p[4]}; return s+d.qty*d.cost; },0);
    const outN  = PR.filter(p=>(stock[p[0]]?.qty||0)===0).length;
    const lowN  = PR.filter(p=>{ const d=stock[p[0]]||{qty:0,safety:10}; return d.qty>0&&d.qty<=d.safety; }).length;
    const now2  = new Date();
    const todS  = sales.filter(s=>new Date(s.date).toDateString()===now2.toDateString());
    const monS  = sales.filter(s=>{ const d=new Date(s.date); return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear(); });
    const todRev = todS.reduce((s,t)=>s+t.total,0);
    const monRev = monS.reduce((s,t)=>s+t.total,0);
    const todCost= todS.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
    const monCost= monS.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
    return { stVal, outN, lowN, todRev, monRev, todProfit:todRev-todCost, monProfit:monRev-monCost, todTx:todS.length, monTx:monS.length };
  }, [stock, sales]);

  // Sales by category (this month)
  const catSales = useMemo(() => {
    const now2=new Date();
    const monS=sales.filter(s=>{ const d=new Date(s.date); return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear(); });
    const map={};
    monS.forEach(t=>t.items.forEach(it=>{
      const cat=PRMAP[it.sku]?.cat||'อื่นๆ';
      if(!map[cat]) map[cat]={cat,rev:0,profit:0};
      map[cat].rev+=it.subtotal;
      map[cat].profit+=it.subtotal-(it.cost||0)*it.qty;
    }));
    return Object.values(map).sort((a,b)=>b.rev-a.rev).slice(0,8);
  }, [sales]);

  // Stock by category
  const catStock = useMemo(() => {
    const map={};
    PR.forEach(p=>{
      const d=stock[p[0]]||{qty:0,cost:p[4]};
      if(!map[p[2]]) map[p[2]]={cat:p[2],items:0,val:0,out:0,low:0};
      map[p[2]].items++;
      map[p[2]].val+=d.qty*d.cost;
      const t=statType(d.qty,d.safety||10);
      if(t==='out') map[p[2]].out++;
      else if(t==='low') map[p[2]].low++;
    });
    return Object.values(map).sort((a,b)=>b.val-a.val);
  }, [stock]);

  // Last 7 days sales
  const daily7 = useMemo(() => {
    const days=[];
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const ds=d.toDateString();
      const daySales=sales.filter(s=>new Date(s.date).toDateString()===ds);
      days.push({ label: d.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit'}), rev: daySales.reduce((s,t)=>s+t.total,0) });
    }
    return days;
  }, [sales]);

  // Alerts
  const alerts = PR.filter(p=>statType(stock[p[0]]?.qty||0, stock[p[0]]?.safety||10)!=='ok').slice(0,15);

  const exportDashboard = () => {
    if (!xlsxReady) return;
    exportXLSX('dashboard_report.xlsx', [
      { name:'KPI', headers:['รายการ','ค่า'],
        data:[['มูลค่าสต็อกรวม','฿'+fmt(metrics.stVal)],['ยอดขายวันนี้','฿'+fmt(metrics.todRev)],['กำไรวันนี้','฿'+fmt(metrics.todProfit)],['ยอดขายเดือนนี้','฿'+fmt(metrics.monRev)],['กำไรเดือนนี้','฿'+fmt(metrics.monProfit)],['หมดสต็อก',metrics.outN+' รายการ'],['ใกล้หมด',metrics.lowN+' รายการ']] },
      { name:'ยอดขายแยกหมวด', headers:['หมวดสินค้า','ยอดขาย (฿)','กำไร (฿)','อัตรากำไร (%)'],
        data: catSales.map(c=>[c.cat, Math.round(c.rev), Math.round(c.profit), c.rev>0?(c.profit/c.rev*100).toFixed(1)+'%':'0%']) },
      { name:'สต็อกแยกหมวด', headers:['หมวดสินค้า','รายการ','มูลค่า (฿)','หมดสต็อก','ใกล้หมด'],
        data: catStock.map(c=>[c.cat,c.items,Math.round(c.val),c.out,c.low]) },
    ]);
  };

  return (
    <div>
      <div style={{...css.row, justifyContent:'space-between', marginBottom:12}}>
        <span style={{fontWeight:500, fontSize:15}}>ภาพรวมระบบ</span>
        <button style={btn('gr',{fontSize:12,padding:'6px 14px'})} onClick={exportDashboard} disabled={!xlsxReady}>
          📥 Export Dashboard
        </button>
      </div>

      {/* KPI Cards */}
      <div style={css.kgrid}>
        {[
          ['📦 สินค้าทั้งหมด', PR.length+' รายการ','#f0f7ff'],
          ['💰 มูลค่าสต็อก','฿'+fmt(metrics.stVal),'#f0fff4'],
          ['💳 ยอดขายวันนี้','฿'+fmt(metrics.todRev),'#fff9f0'],
          ['📈 กำไรวันนี้','฿'+fmt(metrics.todProfit),metrics.todProfit>=0?'#f0fff4':'#fff0f0'],
          ['📅 ยอดขายเดือนนี้','฿'+fmt(metrics.monRev),'#f0f7ff'],
          ['💹 กำไรเดือนนี้','฿'+fmt(metrics.monProfit),metrics.monProfit>=0?'#f0fff4':'#fff0f0'],
          ['❌ หมดสต็อก',metrics.outN+' รายการ','#fff0f0'],
          ['⚠️ ใกล้หมด',metrics.lowN+' รายการ','#fff9f0'],
        ].map(([l,v,bg],i)=>(
          <div key={i} style={{...css.kcard,background:bg}}>
            <div style={{fontSize:11,color:'#666',marginBottom:4}}>{l}</div>
            <div style={{fontSize:19,fontWeight:500}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={css.card}>
          <div style={{fontWeight:500,marginBottom:10}}>ยอดขาย 7 วันล่าสุด</div>
          <BarChart data={daily7} valueKey="rev" labelKey="label" color={C.dark} height={130} />
        </div>
        <div style={css.card}>
          <div style={{fontWeight:500,marginBottom:10}}>ยอดขายแยกหมวด (เดือนนี้)</div>
          {catSales.length===0
            ? <div style={{textAlign:'center',color:'#888',padding:20}}>ยังไม่มียอดขาย</div>
            : <BarChart data={catSales} valueKey="rev" labelKey="cat" color={C.mid} height={130} />}
        </div>
      </div>

      {/* Stock by category */}
      <div style={css.card}>
        <div style={{fontWeight:500,marginBottom:10}}>สต็อกแยกหมวดหมู่</div>
        <div style={css.tow}>
          <table style={css.tbl}>
            <thead><tr>{['หมวดสินค้า','รายการ','มูลค่าสต็อก (฿)','หมดสต็อก','ใกล้หมด'].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
            <tbody>
              {catStock.map((c,i)=>(
                <tr key={c.cat}>
                  <td style={tdc(i)}><b>{c.cat}</b></td>
                  <td style={tdc(i)}>{c.items}</td>
                  <td style={tdc(i)}>฿{fmt(c.val)}</td>
                  <td style={{...tdc(i),color:c.out>0?C.red:'inherit'}}>{c.out>0?c.out:'-'}</td>
                  <td style={{...tdc(i),color:c.low>0?C.amber:'inherit'}}>{c.low>0?c.low:'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length>0 && (
        <div style={css.card}>
          <div style={{fontWeight:500,marginBottom:10}}>⚠️ รายการต้องดูแล ({alerts.length} รายการ)</div>
          <div style={css.tow}>
            <table style={css.tbl}>
              <thead><tr>{['SKU','ชื่อสินค้า','หมวด','สต็อก','Safety','สถานะ'].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
              <tbody>
                {alerts.map((p,i)=>{
                  const d=stock[p[0]]||{qty:0,safety:10};
                  const t=statType(d.qty,d.safety);
                  return <tr key={p[0]}>{[p[0],p[1],p[2],d.qty,d.safety].map((v,j)=><td key={j} style={tdc(i)}>{v}</td>)}<td style={tdc(i)}><span style={bdg(t)}>{statLabel(t)}</span></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// STOCK PAGE
// ════════════════════════════════════════════════════════
function StockPage({ stock, setStock }) {
  const [kw,setKw]=useState(''); const [cat,setCat]=useState('ทั้งหมด');
  const [stF,setStF]=useState('ทั้งหมด'); const [edits,setEdits]=useState({});
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('');
  const xlsxReady=useXLSX();

  const filtered = useMemo(()=>{
    const k=kw.toLowerCase().trim();
    const words=k?k.split(/\s+/).filter(Boolean):[];
    return PR.filter(p=>{
      const hay=(p[0]+' '+p[1]+' '+p[2]+' '+p[3]+' '+p[4]).toLowerCase();
      const mkw=!k||words.every(w=>hay.includes(w));
      const mc=cat==='ทั้งหมด'||p[2]===cat;
      const d=stock[p[0]]||{qty:0,safety:10};
      const t=statType(d.qty,d.safety);
      const ms=stF==='ทั้งหมด'||(stF==='ปกติ'&&t==='ok')||(stF==='ใกล้หมด'&&t==='low')||(stF==='หมดสต็อก'&&t==='out');
      return mkw&&mc&&ms;
    });
  },[kw,cat,stF,stock]);

  const saveAll=async()=>{
    setSaving(true); setMsg('');
    const updates=Object.entries(edits).map(([sku,v])=>({sku,qty:parseInt(v.qty)||0,safety:parseInt(v.safety)||10,cost:parseFloat(v.cost)||0}));
    const {error}=await supabase.from('stock').upsert(updates,{onConflict:'sku'});
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    const ns={...stock}; updates.forEach(u=>{ns[u.sku]={qty:u.qty,safety:u.safety,cost:u.cost};});
    setStock(ns); setEdits({}); setMsg('✅ บันทึก '+updates.length+' รายการ');
    setSaving(false);
  };

  const exportStock=()=>{
    if(!xlsxReady) return;
    const sheets=[];
    // All stock
    sheets.push({name:'สต็อกทั้งหมด',
      headers:['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่าสต็อก','สถานะ'],
      data:PR.map((p,i)=>{
        const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};
        return [i+1,p[0],p[1],p[2],p[3],fmtD(d.cost),d.qty,d.safety,Math.round(d.qty*d.cost),statLabel(statType(d.qty,d.safety))];
      })
    });
    // By category
    CAT_LIST.forEach(cat=>{
      const catPR=PR.filter(p=>p[2]===cat);
      if(!catPR.length) return;
      sheets.push({name:cat.slice(0,31),
        headers:['SKU','ชื่อสินค้า','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่าสต็อก','สถานะ'],
        data:catPR.map(p=>{
          const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};
          return [p[0],p[1],p[3],fmtD(d.cost),d.qty,d.safety,Math.round(d.qty*d.cost),statLabel(statType(d.qty,d.safety))];
        })
      });
    });
    exportXLSX('stock_report.xlsx', sheets);
  };

  return (
    <div>
      <div style={css.card}>
        <div style={{...css.row,gap:8}}>
          <input style={{...css.inp,flex:2,minWidth:160}} placeholder="ค้นหาชื่อ/SKU/ราคา (หลายคำคั่นช่องว่าง)" value={kw} onChange={e=>setKw(e.target.value)}/>
          <select style={css.inp} value={cat} onChange={e=>setCat(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
          <select style={css.inp} value={stF} onChange={e=>setStF(e.target.value)}>{['ทั้งหมด','ปกติ','ใกล้หมด','หมดสต็อก'].map(s=><option key={s}>{s}</option>)}</select>
          <span style={{fontSize:12,color:'#666'}}>พบ {filtered.length} รายการ</span>
          <button style={btn('gr',{fontSize:12,padding:'6px 12px'})} onClick={exportStock} disabled={!xlsxReady}>📥 Export</button>
        </div>
      </div>
      {Object.keys(edits).length>0&&(
        <div style={{...css.row,marginBottom:10,gap:8}}>
          <button style={btn('gr')} onClick={saveAll} disabled={saving}>{saving?'กำลังบันทึก...':'💾 บันทึก '+Object.keys(edits).length+' รายการ'}</button>
          <button style={btn('gy')} onClick={()=>setEdits({})}>ยกเลิก</button>
          {msg&&<span style={{fontSize:12,color:msg.startsWith('✅')?C.green:C.red}}>{msg}</span>}
        </div>
      )}
      <div style={css.tow}>
        <table style={css.tbl}>
          <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่า','สถานะ','แก้ไข'].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((p,i)=>{
              const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};
              const t=statType(d.qty,d.safety); const ed=edits[p[0]];
              return (
                <tr key={p[0]}>
                  <td style={tdc(i)}>{i+1}</td>
                  <td style={{...tdc(i),color:C.blue,fontWeight:500}}>{p[0]}</td>
                  <td style={tdc(i)}>{p[1]}</td>
                  <td style={tdc(i)}>{p[2]}</td>
                  <td style={tdc(i)}>฿{fmt(p[3])}</td>
                  <td style={tdc(i)}>฿{fmtD(ed?ed.cost:d.cost)}</td>
                  <td style={tdc(i)}>{ed?<input type="number" min="0" style={{...css.inp,width:68,padding:'3px 6px',borderColor:'#0D47A1',background:'#E3F2FD',color:'#0D47A1',fontWeight:500,textAlign:'center'}} value={ed.qty} onChange={e=>setEdits(v=>({...v,[p[0]]:{...v[p[0]],qty:e.target.value}}))}/>:<b style={{color:C.blue}}>{d.qty}</b>}</td>
                  <td style={tdc(i)}>{ed?<input type="number" min="0" style={{...css.inp,width:58,padding:'3px 6px',borderColor:C.amber,background:'#FFF3E0',color:C.amber,textAlign:'center'}} value={ed.safety} onChange={e=>setEdits(v=>({...v,[p[0]]:{...v[p[0]],safety:e.target.value}}))}/>:d.safety}</td>
                  <td style={tdc(i)}>฿{fmt(d.qty*d.cost)}</td>
                  <td style={tdc(i)}><span style={bdg(t)}>{statLabel(t)}</span></td>
                  <td style={tdc(i)}>{ed?<button style={{...btn('gy'),padding:'3px 10px',fontSize:11}} onClick={()=>setEdits(v=>{const n={...v};delete n[p[0]];return n;})}>✕</button>:<button style={{...btn(),padding:'3px 10px',fontSize:11}} onClick={()=>{const d2=stock[p[0]]||{qty:0,safety:10,cost:p[4]};setEdits(v=>({...v,[p[0]]:{qty:d2.qty,safety:d2.safety,cost:d2.cost}}));}}>แก้ไข</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// CUSTOMER SEARCH COMPONENT
// ════════════════════════════════════════════════════════
function CustomerSearch({ value, onSelect }) {
  const [q,setQ]=useState('');
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const timerRef=useRef(null);

  const search=async(text)=>{
    if(!text.trim()){setResults([]);return;}
    setLoading(true);
    const {data}=await supabase.from('customers')
      .select('customer_id,name,contact_phone')
      .or(`name.ilike.%${text}%,customer_id.ilike.%${text}%,contact_phone.ilike.%${text}%`)
      .limit(10);
    setResults(data||[]);
    setLoading(false);
  };

  const onInput=(e)=>{
    const v=e.target.value; setQ(v); setOpen(true);
    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>search(v),400);
  };

  const select=(c)=>{
    setQ(c.name); setOpen(false); setResults([]);
    onSelect(c);
  };

  return (
    <div style={{position:'relative',flex:1,minWidth:200}}>
      <input style={{...css.inp,width:'100%'}} placeholder="ค้นหาชื่อลูกค้า / รหัส / เบอร์โทร"
        value={q} onChange={onInput} onFocus={()=>q&&setOpen(true)}/>
      {open&&(results.length>0||loading)&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #ccc',borderRadius:6,zIndex:100,maxHeight:220,overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
          {loading&&<div style={{padding:'8px 12px',color:'#888',fontSize:12}}>กำลังค้นหา...</div>}
          {results.map(c=>(
            <div key={c.customer_id} style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #f0f0f0',fontSize:12}} onMouseDown={()=>select(c)}
              onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              <div style={{fontWeight:500}}>{c.name}</div>
              <div style={{color:'#888',fontSize:11}}>{c.customer_id}{c.contact_phone?' · '+c.contact_phone:''}</div>
            </div>
          ))}
        </div>
      )}
      {value&&<div style={{marginTop:4,fontSize:11,color:C.green}}>✓ เลือก: {value.name} ({value.customer_id})</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SALES PAGE
// ════════════════════════════════════════════════════════
function SalesPage({ stock, setStock, setSales }) {
  const [kw,setKw]=useState('');
  const [cart,setCart]=useState([]);
  const [customer,setCustomer]=useState(null);
  const [note,setNote]=useState('');
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const [channel,setChannel]=useState('In-store');

  const sugs=useMemo(()=>{
    if(!kw.trim()) return [];
    const words=kw.toLowerCase().split(/\s+/).filter(Boolean);
    return PR.filter(p=>{
      const hay=(p[0]+' '+p[1]+' '+p[2]).toLowerCase();
      return words.every(w=>hay.includes(w));
    }).slice(0,15);
  },[kw]);

  const total=cart.reduce((s,x)=>s+x.sell*x.qty,0);
  const totalCost=cart.reduce((s,x)=>s+(x.cost||0)*x.qty,0);
  const profit=total-totalCost;

  const addToCart=p=>{
    setCart(c=>{
      const ex=c.find(x=>x.sku===p[0]);
      if(ex) return c.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x);
      return [...c,{sku:p[0],name:p[1],cat:p[2],sell:p[3],cost:stock[p[0]]?.cost||p[4],qty:1}];
    });
    setKw('');
  };

  const confirmSale=async()=>{
    if(!cart.length) return;
    setSaving(true); setMsg('');
    const items=cart.map(x=>({sku:x.sku,name:x.name,cat:x.cat,qty:x.qty,sell:x.sell,cost:x.cost,subtotal:x.sell*x.qty}));
    const saleData={items,total,note:note||channel,channel,customer_id:customer?.customer_id||null,customer_name:customer?.name||null};
    const {error:sErr}=await supabase.from('sales').insert([saleData]);
    if(sErr){setMsg('❌ '+sErr.message);setSaving(false);return;}
    // Update stock
    const ns={...stock};
    const ups=[];
    for(const it of items){
      const cur=ns[it.sku]?.qty||0;
      ns[it.sku]={...(ns[it.sku]||{}),qty:Math.max(0,cur-it.qty)};
      ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});
    }
    await supabase.from('stock').upsert(ups,{onConflict:'sku'});
    setStock(ns);
    setSales(s=>[...s,saleData]);
    setCart([]); setNote(''); setCustomer(null);
    setMsg('✅ บันทึกการขาย ฿'+fmt(total)+' (กำไร ฿'+fmt(profit)+') — ตัดสต็อกแล้ว');
    setSaving(false);
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,300px)',gap:12}}>
      <div>
        <div style={css.card}>
          <div style={{fontWeight:500,marginBottom:10}}>ค้นหาสินค้าเพื่อเพิ่มในบิล</div>
          <input style={{...css.inp,width:'100%',marginBottom:8}}
            placeholder="พิมพ์ชื่อสินค้า หรือ รหัส SKU" value={kw} onChange={e=>setKw(e.target.value)} autoFocus/>
          {sugs.length>0&&(
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {sugs.map(p=>(
                <button key={p[0]} style={{padding:'5px 10px',border:'1px solid #ddd',borderRadius:6,background:'#f5f5f5',cursor:'pointer',fontSize:12,textAlign:'left'}} onClick={()=>addToCart(p)}>
                  <span style={{fontWeight:500}}>{p[1]}</span>
                  <span style={{color:C.green,marginLeft:6}}>({stock[p[0]]?.qty||0})</span>
                  <span style={{color:'#666',marginLeft:4}}>฿{fmt(p[3])}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {cart.length>0&&(
          <div style={css.card}>
            <div style={{fontWeight:500,marginBottom:10}}>รายการในบิล</div>
            <table style={css.tbl}>
              <thead><tr>{['ชื่อสินค้า','หมวด','ราคา','จำนวน','รวม',''].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
              <tbody>
                {cart.map((x,i)=>(
                  <tr key={x.sku}>
                    <td style={tdc(i)}>{x.name}</td>
                    <td style={{...tdc(i),fontSize:11,color:'#888'}}>{x.cat}</td>
                    <td style={tdc(i)}>฿{fmt(x.sell)}</td>
                    <td style={tdc(i)}><input type="number" min="1" style={{...css.inp,width:60,padding:'3px 6px'}} value={x.qty} onChange={e=>setCart(c=>c.map(it=>it.sku===x.sku?{...it,qty:Math.max(1,parseInt(e.target.value)||1)}:it))}/></td>
                    <td style={tdc(i)}>฿{fmt(x.sell*x.qty)}</td>
                    <td style={tdc(i)}><button style={{background:'none',border:'none',color:C.red,cursor:'pointer',fontSize:18}} onClick={()=>setCart(c=>c.filter(it=>it.sku!==x.sku))}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <div style={css.card}>
          <div style={{fontWeight:500,marginBottom:12}}>สรุปบิล</div>
          <div style={{fontSize:28,fontWeight:500,color:C.green,marginBottom:4}}>฿{fmt(total)}</div>
          <div style={{fontSize:12,color:'#888',marginBottom:12}}>กำไรโดยประมาณ: ฿{fmt(profit)} ({total>0?fmtPct(profit/total*100):'0%'})</div>

          <div style={{fontSize:12,color:'#666',marginBottom:4}}>ลูกค้า</div>
          <CustomerSearch value={customer} onSelect={setCustomer}/>

          <div style={{fontSize:12,color:'#666',marginBottom:4,marginTop:10}}>ช่องทางขาย</div>
          <select style={{...css.inp,width:'100%',marginBottom:8}} value={channel} onChange={e=>setChannel(e.target.value)}>
            {['In-store','Shopee','Lazada','LINE','Facebook','TikTok','Line Man','Grab','อื่นๆ'].map(c=><option key={c}>{c}</option>)}
          </select>

          <div style={{fontSize:12,color:'#666',marginBottom:4}}>หมายเหตุ</div>
          <input style={{...css.inp,width:'100%',marginBottom:12}} placeholder="หมายเหตุเพิ่มเติม..." value={note} onChange={e=>setNote(e.target.value)}/>

          <button style={{...btn('gr'),width:'100%',padding:12,fontSize:14}} onClick={confirmSale} disabled={!cart.length||saving}>
            {saving?'กำลังบันทึก...':'✅ ยืนยันการขาย + ตัดสต็อก'}
          </button>
          {msg&&<div style={{marginTop:10,padding:'8px 10px',borderRadius:6,fontSize:12,background:msg.startsWith('✅')?'#D5F5E3':'#FADBD8',color:msg.startsWith('✅')?C.green:C.red}}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// REPORT PAGE (with PnL)
// ════════════════════════════════════════════════════════
function ReportPage({ sales }) {
  const [period,setPeriod]=useState('month');
  const [selMonth,setSelMonth]=useState(()=>{ const n=new Date(); return n.getFullYear()+'-'+(n.getMonth()+1).toString().padStart(2,'0'); });
  const xlsxReady=useXLSX();

  const filtered=useMemo(()=>{
    const now2=new Date();
    return sales.filter(s=>{
      const d=new Date(s.date);
      if(period==='today') return d.toDateString()===now2.toDateString();
      if(period==='week')  return(now2-d)<7*86400000;
      if(period==='month'){
        const [y,m]=selMonth.split('-');
        return d.getFullYear()===parseInt(y)&&d.getMonth()===parseInt(m)-1;
      }
      return true;
    });
  },[sales,period,selMonth]);

  const revenue = filtered.reduce((s,t)=>s+t.total,0);
  const cost    = filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
  const profit  = revenue-cost;
  const margin  = revenue>0?profit/revenue*100:0;

  // By category
  const catMap={};
  filtered.forEach(t=>t.items.forEach(it=>{
    const cat=PRMAP[it.sku]?.cat||'อื่นๆ';
    if(!catMap[cat]) catMap[cat]={cat,qty:0,rev:0,cost:0};
    catMap[cat].qty+=it.qty;
    catMap[cat].rev+=it.subtotal;
    catMap[cat].cost+=(it.cost||0)*it.qty;
  }));
  const catRows=Object.values(catMap).map(c=>({...c,profit:c.rev-c.cost,margin:c.rev>0?(c.rev-c.cost)/c.rev*100:0})).sort((a,b)=>b.rev-a.rev);

  // Top products
  const skuMap={};
  filtered.forEach(t=>t.items.forEach(it=>{
    if(!skuMap[it.sku]) skuMap[it.sku]={sku:it.sku,name:it.name,cat:PRMAP[it.sku]?.cat||'',qty:0,rev:0,cost:0};
    skuMap[it.sku].qty+=it.qty; skuMap[it.sku].rev+=it.subtotal; skuMap[it.sku].cost+=(it.cost||0)*it.qty;
  }));
  const topItems=Object.values(skuMap).map(r=>({...r,profit:r.rev-r.cost})).sort((a,b)=>b.rev-a.rev).slice(0,20);

  const exportReport=()=>{
    if(!xlsxReady) return;
    const label=period==='month'?selMonth:period==='today'?'วันนี้':period==='week'?'7วัน':'ทั้งหมด';
    exportXLSX(`sales_report_${label}.xlsx`,[
      { name:'สรุปกำไรขาดทุน',
        headers:['รายการ','ยอด (฿)'],
        data:[['ยอดขายรวม',Math.round(revenue)],['ต้นทุนรวม',Math.round(cost)],['กำไรขั้นต้น',Math.round(profit)],['อัตรากำไร (%)',fmtPct(margin)],['จำนวนบิล',filtered.length],['จำนวนชิ้น',filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+b.qty,0),0)]]
      },
      { name:'ยอดขายแยกหมวด',
        headers:['หมวดสินค้า','จำนวนชิ้น','ยอดขาย (฿)','ต้นทุน (฿)','กำไร (฿)','อัตรากำไร (%)'],
        data:catRows.map(c=>[c.cat,c.qty,Math.round(c.rev),Math.round(c.cost),Math.round(c.profit),fmtPct(c.margin)])
      },
      { name:'สินค้าขายดี',
        headers:['#','SKU','ชื่อสินค้า','หมวด','จำนวน','ยอดขาย (฿)','ต้นทุน (฿)','กำไร (฿)'],
        data:topItems.map((r,i)=>[i+1,r.sku,r.name,r.cat,r.qty,Math.round(r.rev),Math.round(r.cost),Math.round(r.profit)])
      },
      { name:'ประวัติบิล',
        headers:['วันที่','บิล#','ลูกค้า','ช่องทาง','ยอด (฿)','ต้นทุน (฿)','กำไร (฿)','หมายเหตุ'],
        data:filtered.slice().reverse().map(s=>{
          const c=s.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0);
          return [thDT(s.date),String(s.id||'').slice(-6),s.customer_name||'-',s.channel||'-',Math.round(s.total),Math.round(c),Math.round(s.total-c),s.note||''];
        })
      }
    ]);
  };

  return (
    <div>
      <div style={{...css.row,marginBottom:12,gap:8}}>
        {[['today','วันนี้'],['week','7 วัน'],['month','เดือน'],['all','ทั้งหมด']].map(([v,l])=>(
          <button key={v} style={nbtn(period===v)} onClick={()=>setPeriod(v)}>{l}</button>
        ))}
        {period==='month'&&<input type="month" style={css.inp} value={selMonth} onChange={e=>setSelMonth(e.target.value)}/>}
        <button style={btn('gr',{fontSize:12,padding:'6px 14px'})} onClick={exportReport} disabled={!xlsxReady}>📥 Export Excel</button>
      </div>

      {/* PnL Summary */}
      <div style={css.card}>
        <div style={{fontWeight:500,marginBottom:12}}>สรุปกำไร-ขาดทุน</div>
        <div style={css.kgrid}>
          {[['ยอดขายรวม','฿'+fmt(revenue),'#f0f7ff'],['ต้นทุนรวม','฿'+fmt(cost),'#fff9f0'],['กำไรขั้นต้น','฿'+fmt(profit),profit>=0?'#f0fff4':'#fff0f0'],['อัตรากำไร',fmtPct(margin),'#f5f5f5'],['จำนวนบิล',filtered.length+' บิล','#f5f5f5'],['ชิ้นที่ขาย',filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+b.qty,0),0)+' ชิ้น','#f5f5f5']].map(([l,v,bg],i)=>(
            <div key={i} style={{...css.kcard,background:bg}}>
              <div style={{fontSize:11,color:'#666',marginBottom:4}}>{l}</div>
              <div style={{fontSize:18,fontWeight:500}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By category */}
      <div style={css.card}>
        <div style={{fontWeight:500,marginBottom:10}}>กำไรแยกหมวดสินค้า</div>
        <div style={css.tow}>
          <table style={css.tbl}>
            <thead><tr>{['หมวดสินค้า','จำนวนชิ้น','ยอดขาย (฿)','ต้นทุน (฿)','กำไร (฿)','Margin %'].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
            <tbody>
              {catRows.length===0?<tr><td colSpan={6} style={{...tdc(0),textAlign:'center',color:'#888'}}>ยังไม่มีข้อมูล</td></tr>:
              catRows.map((c,i)=>(
                <tr key={c.cat}>
                  <td style={{...tdc(i),fontWeight:500}}>{c.cat}</td>
                  <td style={tdc(i)}>{c.qty}</td>
                  <td style={tdc(i)}>฿{fmt(c.rev)}</td>
                  <td style={tdc(i)}>฿{fmt(c.cost)}</td>
                  <td style={{...tdc(i),color:c.profit>=0?C.green:C.red,fontWeight:500}}>฿{fmt(c.profit)}</td>
                  <td style={{...tdc(i),color:c.margin>=30?C.green:c.margin>=10?C.amber:C.red}}>{fmtPct(c.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top products */}
      {topItems.length>0&&(
        <div style={css.card}>
          <div style={{fontWeight:500,marginBottom:10}}>สินค้าขายดี Top 20</div>
          <div style={css.tow}>
            <table style={css.tbl}>
              <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','จำนวน','ยอดขาย','กำไร'].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
              <tbody>
                {topItems.map((r,i)=>(
                  <tr key={r.sku}>
                    <td style={tdc(i)}>{i+1}</td>
                    <td style={{...tdc(i),color:C.blue,fontWeight:500}}>{r.sku}</td>
                    <td style={tdc(i)}>{r.name}</td>
                    <td style={{...tdc(i),fontSize:11,color:'#888'}}>{r.cat}</td>
                    <td style={tdc(i)}>{r.qty}</td>
                    <td style={tdc(i)}>฿{fmt(r.rev)}</td>
                    <td style={{...tdc(i),color:r.profit>=0?C.green:C.red}}>฿{fmt(r.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PRODUCTION PLAN
// ════════════════════════════════════════════════════════
function PlanPage({ stock, sales }) {
  const [days,setDays]=useState(7);
  const [buf,setBuf]=useState(20);
  const xlsxReady=useXLSX();

  const plan=useMemo(()=>{
    const cutoff=new Date(Date.now()-days*86400000);
    const skuS={};
    sales.filter(s=>new Date(s.date)>=cutoff).forEach(t=>t.items.forEach(it=>{skuS[it.sku]=(skuS[it.sku]||0)+it.qty;}));
    return Object.entries(skuS).map(([sku,sold])=>{
      const p=PRMAP[sku]; if(!p) return null;
      const cur=stock[sku]?.qty||0;
      const daily=sold/days;
      const proj=Math.ceil(daily*14*(1+buf/100));
      const need=Math.max(0,proj-cur);
      return need>0?{sku,name:p.name,cat:p.cat,sold,daily,cur,proj,need}:null;
    }).filter(Boolean).sort((a,b)=>b.need-a.need);
  },[sales,stock,days,buf]);

  const exportPlan=()=>{
    if(!xlsxReady||!plan.length) return;
    exportXLSX('production_plan.xlsx',[{
      name:'แผนการผลิต',
      headers:['#','SKU','ชื่อสินค้า','หมวด','ขายใน '+days+'วัน','ขาย/วัน','สต็อก','ต้องผลิต (14วัน+buf)'],
      data:plan.map((r,i)=>[i+1,r.sku,r.name,r.cat,r.sold,r.daily.toFixed(1),r.cur,r.need])
    }]);
  };

  return (
    <div>
      <div style={css.card}>
        <div style={{...css.row,gap:16}}>
          <div><div style={{fontSize:12,color:'#666',marginBottom:4}}>คำนวณจากยอดขาย</div>
            <select style={css.inp} value={days} onChange={e=>setDays(Number(e.target.value))}>{[3,7,14,30].map(d=><option key={d} value={d}>{d} วัน</option>)}</select>
          </div>
          <div><div style={{fontSize:12,color:'#666',marginBottom:4}}>Buffer %</div>
            <select style={css.inp} value={buf} onChange={e=>setBuf(Number(e.target.value))}>{[0,10,20,30,50].map(b=><option key={b} value={b}>{b}%</option>)}</select>
          </div>
          <div style={{fontSize:12,color:'#666',alignSelf:'flex-end',paddingBottom:6}}>แผนผลิตสำหรับ 14 วันข้างหน้า</div>
          {plan.length>0&&<button style={btn('gr',{fontSize:12,padding:'6px 14px',alignSelf:'flex-end',marginBottom:1})} onClick={exportPlan} disabled={!xlsxReady}>📥 Export</button>}
        </div>
      </div>
      {plan.length===0
        ?<div style={{...css.card,textAlign:'center',color:'#888'}}>ยังไม่มีข้อมูลยอดขาย — บันทึกการขายก่อนเพื่อให้ระบบคำนวณได้</div>
        :<div style={css.card}>
          <div style={{fontWeight:500,marginBottom:10}}>แผนการผลิต ({plan.length} รายการ)</div>
          <div style={css.tow}>
            <table style={css.tbl}>
              <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ขายใน '+days+'วัน','ขาย/วัน','สต็อก','ต้องผลิต ★'].map((h,i)=><th key={i} style={css.th}>{h}</th>)}</tr></thead>
              <tbody>{plan.map((r,i)=>(
                <tr key={r.sku}>
                  <td style={tdc(i)}>{i+1}</td>
                  <td style={{...tdc(i),color:C.blue,fontWeight:500}}>{r.sku}</td>
                  <td style={tdc(i)}>{r.name}</td>
                  <td style={{...tdc(i),fontSize:11,color:'#888'}}>{r.cat}</td>
                  <td style={tdc(i)}>{r.sold}</td>
                  <td style={tdc(i)}>{r.daily.toFixed(1)}</td>
                  <td style={tdc(i)}>{r.cur}</td>
                  <td style={{...tdc(i),fontWeight:500,color:C.red}}>{r.need}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════
export default function App() {
  const [tab,setTab]=useState('dash');
  const [stock,setStock]=useState({});
  const [sales,setSales]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    (async()=>{
      const [{data:stData,error:stErr},{data:salData}]=await Promise.all([
        supabase.from('stock').select('*'),
        supabase.from('sales').select('*').order('date',{ascending:false}).limit(1000)
      ]);
      if(stErr){setError('ไม่สามารถเชื่อมต่อ Supabase: '+stErr.message);setLoading(false);return;}
      const sm={};
      (stData||[]).forEach(r=>{sm[r.sku]={qty:r.qty,safety:r.safety,cost:r.cost};});
      // Init missing
      const missing=PR.filter(p=>!sm[p[0]]).map(p=>({sku:p[0],qty:0,safety:10,cost:p[4]}));
      if(missing.length>0){
        await supabase.from('stock').upsert(missing,{onConflict:'sku',ignoreDuplicates:true});
        missing.forEach(r=>{sm[r.sku]={qty:0,safety:10,cost:r.cost};});
      }
      setStock(sm); setSales(salData||[]); setLoading(false);
    })();
  },[]);

  const tabs=[['dash','📊 Dashboard'],['stock','📦 สต็อก'],['sales','💰 บันทึกขาย'],['report','📈 รายงาน'],['plan','🏭 แผนผลิต']];

  if(loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>⏳ กำลังโหลด...</div>;
  if(error)   return <div style={{padding:40,color:C.red}}>❌ {error}</div>;

  return (
    <div style={css.wrap}>
      <div style={css.hdr}>
        <div>
          <div style={{fontWeight:500,fontSize:16}}>☕ สันติพาณิชย์ Stock System v2</div>
          <div style={{fontSize:11,color:'#7EC4A2',marginTop:2}}>Real-time · Export Excel · ระบบลูกค้า · แผนผลิต</div>
        </div>
        <div style={{fontSize:11,color:'#7EC4A2'}}>{PR.length} SKU</div>
      </div>
      <div style={css.nav}>
        {tabs.map(([v,l])=><button key={v} style={nbtn(tab===v)} onClick={()=>setTab(v)}>{l}</button>)}
      </div>
      {tab==='dash'   &&<Dashboard  stock={stock} sales={sales}/>}
      {tab==='stock'  &&<StockPage  stock={stock} setStock={setStock}/>}
      {tab==='sales'  &&<SalesPage  stock={stock} setStock={setStock} setSales={setSales}/>}
      {tab==='report' &&<ReportPage sales={sales}/>}
      {tab==='plan'   &&<PlanPage   stock={stock} sales={sales}/>}
    </div>
  );
}
