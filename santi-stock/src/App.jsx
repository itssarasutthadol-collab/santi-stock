import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './supabase';

const PR = [["PD-100002","9 September 500g.","Espresso",360.0,209.73],["PD-100003","9 September 1 kg.","Espresso",720.0,419.46],["PD-100004","Asian Blend 250g.","Espresso",240.0,107.44],["PD-100005","Asian Blend 500g.","Espresso",340.0,230.83],["PD-100006","Asian Blend 1 kg.","Espresso",680.0,461.65],["PD-100007","Brazil 222 250g.","Espresso",240.0,103.45],["PD-100008","Brazil 222 500g.","Espresso",390.0,222.86],["PD-100009","Brazil 222 1 kg.","Espresso",780.0,445.71],["PD-100010","Brazil Santos M 200g","Espresso",240.0,103.45],["PD-100011","Brazil Santos M 500g","Espresso",375.0,222.86],["PD-100012","Brazil Santos M 1kg.","Espresso",750.0,445.71],["PD-100013","Brazil Santos MD200g","Espresso",240.0,103.45],["PD-100014","Brazil Santos MD500g","Espresso",375.0,222.86],["PD-100015","Brazil Santos MD1kg.","Espresso",750.0,445.71],["PD-100016","Brazilian 250g.","Espresso",240.0,103.45],["PD-100017","Brazilian 500g.","Espresso",390.0,222.86],["PD-100018","Brazilian 1 kg.","Espresso",780.0,445.71],["PD-100019","Caramelized 250g.","Espresso",245.0,96.89],["PD-100020","Caramelized 500g.","Espresso",360.0,209.73],["PD-100021","Caramelized 1 kg.","Espresso",720.0,419.46],["PD-100022","Colombia SPM(M)200g.","Espresso",320.0,125.33],["PD-100023","Colombia SPM(M)500g.","Espresso",475.0,266.61],["PD-100024","Colombia SPM(M)1 kg.","Espresso",950.0,533.21],["PD-100025","Colombia SPM(MD)200g","Espresso",320.0,125.33],["PD-100026","Colombia SPM(MD)500g","Espresso",475.0,266.61],["PD-100027","Colombia SPM(MD)1 kg","Espresso",950.0,533.21],["PD-100028","Fighter 222 250g.","Espresso",210.0,91.58],["PD-100029","Fighter 222 500g.","Espresso",300.0,199.11],["PD-100030","Fighter 222 1 kg.","Espresso",600.0,398.21],["PD-100031","Fighter 228 250g.","Espresso",210.0,91.58],["PD-100032","Fighter 228 500g.","Espresso",300.0,199.11],["PD-100033","Fighter 228 1 kg.","Espresso",600.0,398.21],["PD-100034","Fighter 237 250g.","Espresso",210.0,91.58],["PD-100035","Fighter 237 500g.","Espresso",300.0,199.11],["PD-100036","Fighter 237 1 kg.","Espresso",600.0,398.21],["PD-100037","Full Moon 250g.","Espresso",320.0,113.92],["PD-100038","Full Moon 500g.","Espresso",450.0,236.8],["PD-100039","Full Moon 1 kg.","Espresso",900.0,473.59],["PD-100040","HB Fluffy 250g.","Espresso",310.0,121.03],["PD-100041","HB Fluffy 500g.","Espresso",485.0,258.01],["PD-100042","HB Fluffy 1 kg.","Espresso",970.0,516.02],["PD-100043","HB Jennie 250g.","Espresso",390.0,142.91],["PD-100044","HB Jennie 500g.","Espresso",600.0,301.76],["PD-100045","HB Jennie 1 kg.","Espresso",1200.0,603.52],["PD-100046","KTT 250g.","Espresso",325.0,105.95],["PD-100047","KTT 500g.","Espresso",450.0,227.86],["PD-100048","KTT 1 kg.","Espresso",900.0,455.71],["PD-100049","Lao 222 250g.","Espresso",220.0,98.77],["PD-100050","Lao 222 500g.","Espresso",350.0,213.48],["PD-100051","Lao 222 1 kg.","Espresso",700.0,426.96],["PD-100052","Lao 228 250g.","Espresso",220.0,98.77],["PD-100053","Lao 228 500g.","Espresso",350.0,213.48],["PD-100054","Lao 228 1 kg.","Espresso",700.0,426.96],["PD-100055","Lao 233 250g.","Espresso",220.0,98.77],["PD-100056","Lao 233 500g.","Espresso",350.0,213.48],["PD-100057","Lao 233 1 kg.","Espresso",700.0,426.96],["PD-100058","MBY (Yor-Chue) 250g.","Espresso",270.0,102.44],["PD-100059","MBY (Yor-Chue) 500g.","Espresso",375.0,220.83],["PD-100060","MBY (Yor-Chue) 1 kg.","Espresso",750.0,441.65],["PD-100061","MBY (Yor-Ta) 250g.","Espresso",270.0,102.44],["PD-100062","MBY (Yor-Ta) 500g.","Espresso",375.0,220.83],["PD-100063","MBY (Yor-Ta) 1 kg.","Espresso",750.0,441.65],["PD-100064","MBY 3 King 250g.","Espresso",330.0,111.27],["PD-100065","MBY 3 King 500g.","Espresso",450.0,238.48],["PD-100066","MBY 3 King 1 kg.","Espresso",900.0,476.96],["PD-100067","Milk Choc 250g.","Espresso",260.0,105.64],["PD-100068","Milk Choc 500g.","Espresso",375.0,227.23],["PD-100069","Milk Choc 1 kg.","Espresso",750.0,454.46],["PD-100070","Milk's Father 250g.","Espresso",290.0,105.02],["PD-100071","Milk's Father 500g.","Espresso",425.0,225.98],["PD-100072","Milk's Father 1 kg.","Espresso",850.0,451.96],["PD-100073","Omkoi Washเข้ม 250g.","Espresso",370.0,119.08],["PD-100074","Omkoi Washเข้ม 500g.","Espresso",495.0,254.11],["PD-100075","Omkoi Washเข้ม 1 kg.","Espresso",990.0,508.21],["PD-100076","Omkoi Washกลาง 250g.","Espresso",370.0,119.08],["PD-100077","Omkoi Washกลาง 500g.","Espresso",495.0,254.11],["PD-100078","Omkoi Washกลาง 1kg.","Espresso",990.0,508.21],["PD-100079","Peanut Butter 250g.","Espresso",310.0,120.33],["PD-100080","Peanut Butter 500g.","Espresso",485.0,256.61],["PD-100081","Peanut Butter 1 kg.","Espresso",970.0,513.21],["PD-100082","Sammuen MD 250g.","Espresso",350.0,115.95],["PD-100083","Sammuen MD 500g.","Espresso",450.0,247.86],["PD-100084","Sammuen MD 1 kg.","Espresso",900.0,495.71],["PD-100085","Sammuen Medium 250g.","Espresso",350.0,115.95],["PD-100086","Sammuen Medium 500g.","Espresso",450.0,247.86],["PD-100087","Sammuen Medium 1 kg.","Espresso",900.0,495.71],["PD-100088","Spartan 222 250g.","Espresso",210.0,99.08],["PD-100089","Spartan 222 500g.","Espresso",300.0,214.11],["PD-100090","Spartan 222 1 kg.","Espresso",600.0,428.21],["PD-100091","Spartan 228 250g.","Espresso",210.0,99.08],["PD-100092","Spartan 228 500g.","Espresso",300.0,214.11],["PD-100093","Spartan 228 1 kg.","Espresso",600.0,428.21],["PD-100094","Spartan 233 250g.","Espresso",210.0,99.08],["PD-100095","Spartan 233 500g.","Espresso",300.0,214.11],["PD-100096","Spartan 233 1 kg.","Espresso",600.0,428.21],["PD-100097","The Slowly 216 250g.","Espresso",230.0,105.64],["PD-100098","The Slowly 216 500g.","Espresso",350.0,227.23],["PD-100099","The Slowly 216 1 kg.","Espresso",700.0,454.46],["PD-100100","The Slowly 222 250g.","Espresso",230.0,105.64],["PD-100101","The Slowly 222 500g.","Espresso",350.0,227.23],["PD-100102","The Slowly 222 1 kg.","Espresso",700.0,454.46],["PD-100103","The Slowly 228 250g.","Espresso",230.0,105.64],["PD-100104","The Slowly 228 500g.","Espresso",350.0,227.23],["PD-100105","The Slowly 228 1 kg.","Espresso",700.0,454.46],["PD-100106","ดอยช้าง212 250g.","Espresso",290.0,106.58],["PD-100107","ดอยช้าง212 500g.","Espresso",370.0,229.11],["PD-100108","ดอยช้าง212 1 kg.","Espresso",740.0,458.21],["PD-100109","ดอยช้าง222 250g.","Espresso",290.0,106.58],["PD-100110","ดอยช้าง222 500g.","Espresso",370.0,229.11],["PD-100111","ดอยช้าง222 1 kg.","Espresso",740.0,458.21],["PD-100112","ดอยช้าง228 250g.","Espresso",290.0,106.58],["PD-100113","ดอยช้าง228 500g.","Espresso",370.0,229.11],["PD-100114","ดอยช้าง228 1 kg.","Espresso",740.0,458.21],["PD-100115","สู่สุขคติ 237 250g.","Espresso",210.0,82.2],["PD-100116","สู่สุขคติ 237 500g.","Espresso",300.0,180.36],["PD-100117","สู่สุขคติ 237 1 kg.","Espresso",600.0,360.71],["PD-100118","Colombia Chiroso100g","Filter",500.0,176.52],["PD-100119","Colombia Chiroso200g","Filter",990.0,344.89],["PD-100120","Sammuen Washed 200g.","Filter",300.0,56.27],["PD-100121","MBY Fully Washed200g","Filter",320.0,104.39],["PD-100122","MBY Honey 200g.","Filter",335.0,105.64],["PD-100123","MBY Natural 200g.","Filter",420.0,105.64],["PD-100124","ภูฟ้า Natural 200g.","Filter",220.0,74.39],["PD-100125","Omkoiโฆ๊ะผะโด๊ะ 200g","Filter",275.0,106.89],["PD-100126","Omkoi Honey 200g.","Filter",290.0,111.89],["PD-100127","Omkoi Red Honey 200g","Filter",325.0,126.89],["PD-100128","Omkoi Wased 200g.","Filter",275.0,106.89],["PD-100129","Hojicha 50g.","Non-Coffee",160.0,82.3],["PD-100130","Hojicha 100g.","Non-Coffee",290.0,159.4],["PD-100131","Hojicha 200g.","Non-Coffee",570.0,313.59],["PD-100132","Hojicha 500g.","Non-Coffee",1300.0,780.55],["PD-100133","Kyoto 50g.","Non-Coffee",260.0,93.54],["PD-100134","Kyoto 100g.","Non-Coffee",490.0,181.89],["PD-100135","Kyoto 200g.","Non-Coffee",950.0,358.59],["PD-100136","Kyoto 500g.","Non-Coffee",2300.0,893.05],["PD-100137","Kyoto 1kg.","Non-Coffee",4600.0,1767.0],["PD-100138","Shizuoka 50g.","Non-Coffee",260.0,92.05],["PD-100139","Shizuoka 100g.","Non-Coffee",490.0,184.1],["PD-100140","Shizuoka 200g.","Non-Coffee",950.0,372.83],["PD-100141","Shizuoka 500g.","Non-Coffee",2300.0,929.49],["PD-100142","Shizuoka 1kg.","Non-Coffee",4600.0,1841.0],["PD-100143","แบล็คโกโก้ 200g.","Non-Coffee",155.0,86.53],["PD-100144","แบล็คโกโก้ 500g.","Non-Coffee",330.0,213.73],["PD-100145","แบล็คโกโก้ 1kg.","Non-Coffee",660.0,409.48],["PD-100146","โกโก้สูตร1 200g.","Non-Coffee",160.0,104.83],["PD-100147","โกโก้สูตร1 500g.","Non-Coffee",350.0,259.49],["PD-100148","โกโก้สูตร1 1kg.","Non-Coffee",700.0,501.0],["PD-100149","โกโก้สูตร2 200g.","Non-Coffee",165.0,107.61],["PD-100150","โกโก้สูตร2 500g.","Non-Coffee",355.0,266.44],["PD-100151","โกโก้สูตร2 1kg.","Non-Coffee",710.0,514.9],["PD-100152","โกโก้สูตร3 200g.","Non-Coffee",150.0,70.23],["PD-100153","โกโก้สูตร3 500g.","Non-Coffee",315.0,172.99],["PD-100154","โกโก้สูตร3 1kg.","Non-Coffee",630.0,328.0],["PD-100155","โกโก้สูตร4 200g.","Non-Coffee",120.0,57.23],["PD-100156","โกโก้สูตร4 500g.","Non-Coffee",245.0,140.49],["PD-100157","โกโก้สูตร4 1kg.","Non-Coffee",490.0,263.0],["PD-100158","โกโก้สูตร5 200g.","Non-Coffee",155.0,98.63],["PD-100159","โกโก้สูตร5 500g.","Non-Coffee",335.0,243.99],["PD-100160","โกโก้สูตร5 1kg.","Non-Coffee",670.0,470.0],["PD-100161","ชาเขียวมะลิใส 100g.","Non-Coffee",150.0,54.5],["PD-100162","ชาเขียวมะลิใส 500g.","Non-Coffee",275.0,155.0],["PD-100163","ชาเขียวมะลินม 200g.","Non-Coffee",110.0,56.27],["PD-100164","ชาเขียวมะลินม 500g.","Non-Coffee",225.0,138.09],["PD-100165","ชาเขียวมะลินม 1 kg.","Non-Coffee",450.0,258.2],["PD-100166","ชาไทย(1) 200g.","Non-Coffee",100.0,33.63],["PD-100167","ชาไทย(1) 500g.","Non-Coffee",200.0,81.49],["PD-100168","ชาไทย(1) 1kg.","Non-Coffee",400.0,145.0],["PD-100169","ชาไทย(2) 200g.","Non-Coffee",100.0,38.94],["PD-100170","ชาไทย(2) 500g.","Non-Coffee",200.0,94.77],["PD-100171","ชาไทย(2) 1kg.","Non-Coffee",400.0,171.56],["PD-100172","ชาดำอัสสัม 200g.","Non-Coffee",165.0,58.63],["PD-100173","ชาดำอัสสัม 500g.","Non-Coffee",225.0,143.99],["PD-100174","ชาบาบูตง200gสูตรใหม่","Non-Coffee",80.0,24.94],["PD-100175","ชาบาบูตง500gสูตรเก่า","Non-Coffee",140.0,66.77],["PD-100176","ชาบาบูตง500gสูตรใหม่","Non-Coffee",140.0,59.77],["PD-100177","ชาบาบูตง1kg.สูตรเก่า","Non-Coffee",280.0,115.56],["PD-100178","ชาบาบูตง1kg.สูตรใหม่","Non-Coffee",280.0,101.56],["PD-100179","ชามะนาว3in1 500g.","Non-Coffee",140.0,66.77],["PD-100180","ชามะนาว3in1 1 kg.","Non-Coffee",240.0,115.56],["PD-100181","ชาอินโดOriginal500g.","Non-Coffee",110.0,47.77],["PD-100182","ชาอินโดOriginal1kg.","Non-Coffee",220.0,77.56],["PD-100183","ชาอินโดPremium 500g.","Non-Coffee",140.0,66.77],["PD-100184","ชาอินโดPremium1kg.","Non-Coffee",280.0,115.56],["PD-100185","GBสามหมื่นNatural1kg","Green Bean",430.0,347.15],["PD-100186","GB Brazil Cerrado1kg","Green Bean",420.0,307.15],["PD-100187","GB Brazil santos 1kg","Green Bean",420.0,307.15],["PD-100188","GB ปางขอน Fully 2","Green Bean",430.0,242.15],["PD-100189","GB ปางขอน Fully1","Green Bean",430.0,242.15],["PD-100190","GB ปางขอน Honey 1kg.","Green Bean",405.0,312.153],["PD-100191","GBปางขอนNatura 1kg.","Green Bean",450.0,352.15],["PD-100192","GB Omkoi Honey 1 kg.","Green Bean",470.0,377.15],["PD-100193","GB Omkoi RedHoney1kg","Green Bean",535.0,437.15],["PD-100194","GB Omkoi Wash 1 kg.","Green Bean",440.0,357.15],["PD-100195","GB OmkoiWashโฆ๊ะ 1kg","Green Bean",440.0,357.15],["PD-100196","GB สามหมื่น Peaberry","Green Bean",430.0,347.15],["PD-100197","GB สามหมื่น Wash (A)","Green Bean",430.0,347.15],["PD-100198","GB สามหมื่น Wash (B)","Green Bean",430.0,347.15],["PD-100199","Dripbag Setกาแฟ(ถุง)","Dripbag Coffee",350.0,125.5],["PD-100200","Dripbag 3 King","Dripbag Coffee",40.0,10.54],["PD-100201","Dripbag Fighter237","Dripbag Coffee",40.0,9.61],["PD-100202","Dripbag KTT Blend","Dripbag Coffee",40.0,11.28],["PD-100203","Dripbag Lao 228","Dripbag Coffee",40.0,9.58],["PD-100204","Dripbag MBY Honey","Dripbag Coffee",40.0,10.79],["PD-100205","Dripbag MBY Natural","Dripbag Coffee",40.0,11.19],["PD-100206","Dripbag MBY Washed","Dripbag Coffee",40.0,10.01],["PD-100207","Dripbag Milk Choc","Dripbag Coffee",40.0,10.09],["PD-100208","Dripbag Slowly222","Dripbag Coffee",40.0,9.93],["PD-100209","Dripbag Spartan222","Dripbag Coffee",40.0,9.56],["PD-100210","Dripbag Spartan228","Dripbag Coffee",40.0,9.58],["PD-100211","Dripbag ภูฟ้า","Dripbag Coffee",40.0,9.78],["PD-100212","Dripbag สู่สุขคติ237","Dripbag Coffee",40.0,9.51],["PD-100213","Dripbag อมก๋อย Wash","Dripbag Coffee",40.0,11.24],["PD-100214","DripbagBYBerryVillag","Dripbag Coffee",40.0,11.75],["PD-100215","ชะลอมหูหิ้วกาแฟ10ซอง","Dripbag Coffee",450.0,142.5],["PD-100216","Dripbag Set ชา(ถุง)","Dripbag Non Coffee",270.0,76.5],["PD-100217","Dripbag ชา 3ช่า","Dripbag Non Coffee",30.0,5.99],["PD-100218","Dripbag ชาไทย สูตร1","Dripbag Non Coffee",30.0,6.76],["PD-100219","Dripbag ชาไทย สูตร2","Dripbag Non Coffee",30.0,7.12],["PD-100220","Dripbag ชาดำ","Dripbag Non Coffee",30.0,7.25],["PD-100221","Dripbagชาเขียวมะลิใส","Dripbag Non Coffee",30.0,6.1],["PD-100222","Dripbagชาเขียวมะลินม","Dripbag Non Coffee",30.0,7.0],["PD-100223","ชะลอมตลับชา 10ซอง","Dripbag Non Coffee",350.0,97.5],["PD-100224","Capsule KTT Blend","Capsules Coffee",248.0,137.08],["PD-100225","Capsule Lao228","Capsules Coffee",248.0,65.95],["PD-100226","Capsule MBY Yor-Chue","Capsules Coffee",248.0,136.23],["PD-100227","Capsule Milk'sFather","Capsules Coffee",248.0,136.85],["PD-100228","Capsule SET (รวมรส)","Capsules Coffee",248.0,137.08],["PD-100229","Capsule Slowly222","Capsules Coffee",248.0,137.0],["PD-100230","Capsule Spartan222","Capsules Coffee",248.0,66.03],["PD-100231","Capsule ภูฟ้า Natura","Capsules Coffee",248.0,61.08],["PD-100232","Capsule อมก๋อย Wash","Capsules Coffee",248.0,70.83],["PD-100233","SET30Cap KTT Blend","Capsules Coffee",660.0,387.97],["PD-100234","SET30Cap Milk's Fath","Capsules Coffee",660.0,387.29],["PD-100235","SET30Cap The Slowly","Capsules Coffee",660.0,387.74],["PD-100236","SET30Cap Yor-Chue","Capsules Coffee",660.0,385.43],["PD-100237","50Cap(2รสชาติ)ทักแชท","Capsules Coffee",999.0,638.38],["PD-100238","Capsules ชาเขียวมะลิ","Capsules Non-Coffee",148.0,51.2],["PD-100239","Capsules ชาไทย","Capsules Non-Coffee",148.0,47.0],["PD-100240","Capsules ชาดำ","Capsules Non-Coffee",148.0,52.0],["PD-100241","Capsules ชาพีช","Capsules Non-Coffee",148.0,55.2],["PD-100242","Capsules มัทฉะ","Capsules Non-Coffee",148.0,58.9],["PD-100243","พร้อมดื่มLight Fruit","Cold Brew",70.0,20.08],["PD-100244","Light Fruit 200ml","Cold Brew",100.0,20.05],["PD-100245","Light Fruit 500ml","Cold Brew",150.0,53.49],["PD-100246","Light Fruit 1000ml.","Cold Brew",250.0,96.29],["PD-100247","Light Fruit 5000ml","Cold Brew",850.0,434.39],["PD-100248","พร้อมดื่มMedium Choc","Cold Brew",70.0,21.38],["PD-100249","Medium Choc 200ml","Cold Brew",100.0,21.34],["PD-100250","Medium Choc 500ml","Cold Brew",150.0,56.73],["PD-100251","Medium Choc 1000ml.","Cold Brew",250.0,102.76],["PD-100252","Medium Choc 5000ml","Cold Brew",850.0,466.71],["PD-100253","พร้อมดื่มDark Choc","Cold Brew",70.0,22.62],["PD-100254","Dark Choc 200ml","Cold Brew",100.0,22.59],["PD-100255","Dark Choc 500ml","Cold Brew",150.0,59.84],["PD-100256","Dark Choc 1000ml.","Cold Brew",250.0,108.99],["PD-100257","Dark Choc 5000ml","Cold Brew",850.0,497.89],["PD-100258","พร้อมดื่มFloral","Cold Brew",70.0,20.3],["PD-100259","Floral 200ml.","Cold Brew",100.0,20.27],["PD-100260","Floral 500ml","Cold Brew",150.0,54.03],["PD-100261","Floral 1000ml.","Cold Brew",250.0,97.37],["PD-100262","พร้อมดื่มHoneyLemon","Cold Brew",70.0,26.3],["PD-100263","Honey Lemon 200ml","Cold Brew",100.0,26.27],["PD-100264","Honey Lemon 500ml","Cold Brew",220.0,69.03],["PD-100265","Honey Lemon 1000ml.","Cold Brew",330.0,127.37],["PD-100266","พร้อมดื่มBerry","Cold Brew",70.0,20.89],["PD-100267","Berry Forest 200ml","Cold Brew",100.0,20.86],["PD-100268","Berry Forest 500ml","Cold Brew",220.0,55.52],["PD-100269","Berry Forest 1000ml.","Cold Brew",330.0,100.34],["PD-100270","พร้อมดื่มToffee","Cold Brew",70.0,22.03],["PD-100271","Toffee Caramel 200ml","Cold Brew",100.0,21.99],["PD-100272","Toffee Caramel 500ml","Cold Brew",220.0,58.35],["PD-100273","Toffee Caramel1000ml","Cold Brew",330.0,106.0],["PD-100274","Samui 200ml","Cold Brew",100.0,22.66],["PD-100275","Samui 500ml","Cold Brew",220.0,60.03],["PD-100276","Samui 1000ml.","Cold Brew",330.0,109.36],["PD-100277","Blush Fusion 200ml","Cold Brew",100.0,20.7],["PD-100278","Blush Fusion 500ml","Cold Brew",220.0,55.11],["PD-100279","Blush Fusion 1000ml.","Cold Brew",330.0,99.53],["PD-100280","Tom Yum 200ml","Cold Brew",100.0,24.49],["PD-100281","Tom Yum 500ml","Cold Brew",220.0,64.59],["PD-100282","Tom Yum 1000ml.","Cold Brew",330.0,118.49],["PD-100283","พร้อมดื่มคละรส 7ขวด,กระเป๋าเก็บความเย็น","Cold Brew",490.0,167.84],["PD-100284","Tattoo รวมผี","Free Gift",35.0,14.5],["PD-100285","Roaster,Black ดำ","Coffee Machine",28900.0,0.0],["PD-100286","Roaster,Red แดง","Coffee Machine",28900.0,0.0],["PD-100287","Roaster+Cooling Tray,Black ดำ","Coffee Machine",33000.0,0.0],["PD-100288","Roaster+Cooling Tray,Red แดง","Coffee Machine",33000.0,0.0],["PD-100289","DUOMO สีขาว","Accessories",7400.0,5900.0],["PD-100290","DUOMO สีดำ","Accessories",6100.0,4900.0],["PD-100291","Force Tamper เงินเงา","Accessories",6155.0,4900.0],["PD-100292","Force Tamper เงินแมท","Accessories",6155.0,4900.0],["PD-100293","Force Tamper ลายไม้","Accessories",6155.0,4900.0],["PD-100294","Force Tamper สีดำ","Accessories",6155.0,4900.0],["PD-100295","Force Tamper สีดำเงา","Accessories",6155.0,4900.0],["PD-100296","Light Fruit 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100297","Light Fruit 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100298","Light Fruit 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100299","Light Fruit 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100300","Light Fruit 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100301","Light Fruit 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100302","Light Fruit 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100303","Medium Choc 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100304","Medium Choc 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100305","Medium Choc 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100306","Medium Choc 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100307","Medium Choc 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100308","Medium Choc 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100309","Medium Choc 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100310","Dark Choc 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100311","Dark Choc 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100312","Dark Choc 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100313","Dark Choc 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100314","Dark Choc 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100315","Dark Choc 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100316","Dark Choc 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100317","Floral 1000ml.,พร้อมดื่มLight Fruit","Promotion",251.0,96.41],["PD-100318","Floral 1000ml.,พร้อมดื่มMedium Choc","Promotion",251.0,96.41],["PD-100319","Floral 1000ml.,พร้อมดื่มDark Choc","Promotion",251.0,96.41],["PD-100320","Floral 1000ml.,พร้อมดื่มFloral","Promotion",251.0,96.41],["PD-100321","Floral 1000ml.,พร้อมดื่มHoneyLemon","Promotion",251.0,96.41],["PD-100322","Floral 1000ml.,พร้อมดื่มBerry","Promotion",251.0,96.41],["PD-100323","Floral 1000ml.,พร้อมดื่มToffee","Promotion",251.0,96.41],["PD-100324","Honey Lemon 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100325","Honey Lemon 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100326","Honey Lemon 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100327","Honey Lemon 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100328","Honey Lemon 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100329","Honey Lemon 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100330","Honey Lemon 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100331","Berry Forest 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100332","Berry Forest 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100333","Berry Forest 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100334","Berry Forest 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100335","Berry Forest 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100336","Berry Forest 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100337","Berry Forest 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100338","Toffee Caramel1000ml,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100339","Toffee Caramel1000ml,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100340","Toffee Caramel1000ml,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100341","Toffee Caramel1000ml,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100342","Toffee Caramel1000ml,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100343","Toffee Caramel1000ml,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100344","Toffee Caramel1000ml,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100345","Samui 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100346","Samui 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100347","Samui 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100348","Samui 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100349","Samui 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100350","Samui 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100351","Samui 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100352","Blush Fusion 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100353","Blush Fusion 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100354","Blush Fusion 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100355","Blush Fusion 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100356","Blush Fusion 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100357","Blush Fusion 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100358","Blush Fusion 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100359","Tom Yum 1000ml.,พร้อมดื่มLight Fruit","Promotion",331.0,129.18],["PD-100360","Tom Yum 1000ml.,พร้อมดื่มMedium Choc","Promotion",331.0,129.18],["PD-100361","Tom Yum 1000ml.,พร้อมดื่มDark Choc","Promotion",331.0,129.18],["PD-100362","Tom Yum 1000ml.,พร้อมดื่มFloral","Promotion",331.0,129.18],["PD-100363","Tom Yum 1000ml.,พร้อมดื่มHoneyLemon","Promotion",331.0,129.18],["PD-100364","Tom Yum 1000ml.,พร้อมดื่มBerry","Promotion",331.0,129.18],["PD-100365","Tom Yum 1000ml.,พร้อมดื่มToffee","Promotion",331.0,129.18],["PD-100366","Medium Roast,30 กรัม","Accessories",415.0,0.0],["PD-100367","Medium Roast,60 กรัม","Accessories",795.0,0.0],["PD-100368","Medium Dark Roast,30 กรัม","Accessories",415.0,0.0],["PD-100369","Medium Dark Roast,60 กรัม","Accessories",795.0,0.0],["PD-100370","กส.รูปเสือ เล็ก","Accessories",150.0,0.0],["PD-100371","กส.กระสอบเปล่า","Accessories",65.0,0.0],["PD-100372","กส.THAI ม่วง","Accessories",250.0,0.0],["PD-100373","กส.ตัวหนังสือ","Accessories",150.0,0.0],["PD-100374","กส.Lao","Accessories",250.0,0.0],["PD-100375","กส.ตัวหนังสือครึ่ง","Accessories",250.0,0.0],["PD-100376","กส.รูปเสือ ใหญ่","Accessories",250.0,0.0],["PD-100377","กส.รูปกบ ใหญ่","Accessories",250.0,0.0],["PD-100378","กส.รูปช้าง","Accessories",120.0,0.0],["PD-100379","กส.รูปม้าลาย","Accessories",150.0,0.0],["PD-100380","ORGM Ceramic ชมพู,M","Accessories",1050.0,873.12],["PD-100381","ORGM Ceramic เหลือง,S","Accessories",980.0,864.25],["PD-100382","ORGMCeramicMattGreen,M","Accessories",1050.0,873.12],["PD-100383","ORGM Ceramic ดำ,S","Accessories",980.0,864.25],["PD-100384","ORGM Ceramic Navy,S","Accessories",980.0,864.25],["PD-100385","ORGMCeramicMattBeige,S","Accessories",980.0,864.25],["PD-100386","ORGM Ceramic เขียว,S","Accessories",980.0,864.25],["PD-100387","ORGMCeramic White,M","Accessories",1050.0,873.12],["PD-100388","ORGM Ceramic ม่วง,M","Accessories",1050.0,873.12],["PD-100389","ORGM Ceramic Navy,M","Accessories",1050.0,873.12],["PD-100390","ORGMCeramicMatt Pink,M","Accessories",1050.0,873.12],["PD-100391","ORGM Ceramic ส้ม,M","Accessories",1050.0,873.12],["PD-100392","ORGMCeramicMattGrey,M","Accessories",1050.0,873.12],["PD-100393","ORGM Ceramic แดง,S","Accessories",980.0,864.25],["PD-100394","ORGMCeramicMatt Blue,M","Accessories",1050.0,873.12],["PD-100395","ORGM Ceramic น้ำตาล,S","Accessories",980.0,864.25],["PD-100396","ORGM Ceramic เหลือง,M","Accessories",1050.0,873.12],["PD-100397","ORGMCeramicMattGrey,S","Accessories",980.0,864.25],["PD-100398","ORGMCeramicMatt Blue,S","Accessories",980.0,864.25],["PD-100399","ORGM Ceramic เขียว,M","Accessories",1050.0,873.12],["PD-100400","ORGM Ceramic ม่วง,S","Accessories",980.0,864.25],["PD-100401","ORGM Ceramic ส้ม,S","Accessories",980.0,864.25],["PD-100402","ORGM Ceramic น้ำตาล,M","Accessories",1050.0,873.12],["PD-100403","ORGMCeramicMattGreen,S","Accessories",980.0,864.25],["PD-100404","ORGM Ceramic แดง,M","Accessories",1050.0,873.12],["PD-100405","ORGM Ceramic ชมพู,S","Accessories",980.0,864.25],["PD-100406","ORGM Ceramic ฟ้าคราม,M","Accessories",1050.0,873.12],["PD-100407","ORGM Ceramic ฟ้าคราม,S","Accessories",980.0,864.25],["PD-100408","ORGMCeramicMattBeige,M","Accessories",1050.0,873.12],["PD-100409","ORGM Ceramic ดำ,M","Accessories",1050.0,873.12],["PD-100410","ORGMCeramic White,S","Accessories",980.0,864.25],["PD-100411","ORGMCeramicMatt Pink,S","Accessories",980.0,864.25],["PD-100412","BY Berry Village200g","Accessories",790.0,118.14],["PD-100413","FelicitaParallelPlus","Accessories",3900.0,2700.0],["PD-100414","ฐาน Ripple 58.35 mm.","Accessories",810.0,500.0],["PD-100415","ฐาน Flat 58.50 mm.","Accessories",810.0,500.0],["PD-100416","ฐาน Waffle 58.50 mm.","Accessories",1070.0,750.0],["PD-100417","ฐาน Waffle 58.35 mm.","Accessories",1070.0,750.0],["PD-100418","ฐาน Ripple 58.50 mm.","Accessories",810.0,500.0],["PD-100419","CAFEC T-92 4CUP","Accessories",180.0,115.0],["PD-100420","CAFEC T-92 1CUP","Accessories",160.0,105.0],["PD-100421","CAFEC T-83 4CUP","Accessories",180.0,115.5],["PD-100422","CAFEC T-83 1CUP","Accessories",160.0,105.0],["PD-100423","CAFEC T-90 4CUP","Accessories",180.0,115.5],["PD-100424","CAFEC T-90 1CUP","Accessories",160.0,105.0],["PD-100425","ยางซิลิโคน สีเขียว","Accessories",740.0,385.0],["PD-100426","ยางซิลิโคน สีชมพู","Accessories",740.0,385.0],["PD-100427","ยางซิลิโคน สีดำ","Accessories",740.0,385.0],["PD-100428","ยางซิลิโคน สีเหลือง","Accessories",740.0,385.0],["PD-100429","Dripper ใส 1CUP","Accessories",280.0,225.0],["PD-100430","Dripper ใส 4CUP","Accessories",320.0,250.0],["PD-100431","แก้วตวง","Free Gift",0.0,3.81],["PD-100432","ถุงเก็บความเย็น","Free Gift",0.0,11.77],["PD-100433","Maejantai 100g.","Filter",400.0,177.27],["PD-100434","Maejantai 200g.","Filter",780.0,346.39],["PD-100435","Panama Geisha 50g.","Filter",700.0,330.87],["PD-100436","Panama Geisha 100g.","Filter",1250.0,650.64],["PD-100437","Panama Geisha 200g.","Filter",2400.0,1293.14],["PD-100438","ช้อนตวง ตักกาแฟแบบ 2 in 1","Accessories",35.0,0.0],["PD-100439","เครื่องแคปซูล (ขาว)","Accessories",2500.0,1878.24],["PD-100440","FelicitaParalleScale","Accessories",3400.0,2200.0],["PD-100441","Felicita Oval Black","Accessories",14900.0,9500.0],["PD-100442","Felicita Oval White","Accessories",14900.0,9500.0],["PD-100443","Arco 2in1 Grinder","Accessories",19900.0,12000.0],["PD-100444","Arco Hand Grinder","Accessories",8900.0,6000.0],["PD-100445","Grinder Clean 450g.","Accessories",1460.0,976.5],["PD-100446","FLAT FAST M 50 แผ่น","Accessories",970.0,648.78],["PD-100447","FLAT FAST M 100 แผ่น","Accessories",1620.0,1077.32],["PD-100448","FLAT FAST M 25 แผ่น","Accessories",640.0,426.83],["PD-100449","CONE FAST XL,100","Accessories",1920.0,1281.33],["PD-100450","CONE FAST M,50","Accessories",970.0,648.78],["PD-100451","CONE FAST XL,25","Accessories",760.0,1077.32],["PD-100452","CONE FAST S,25","Accessories",640.0,426.83],["PD-100453","CONE FAST S,50","Accessories",970.0,648.78],["PD-100454","CONE FAST XL,50","Accessories",970.0,771.26],["PD-100455","CONE FAST S,100","Accessories",1620.0,1280.33],["PD-100456","CONE FAST M,100","Accessories",1620.0,1077.32],["PD-100457","CONE FAST M,25","Accessories",640.0,426.83],["PD-100458","ESPRESSO SOFT FILTER","Accessories",600.0,398.32],["PD-100459","ESPRESSO HIGH CELLUL","Accessories",700.0,468.88],["PD-100460","ESPRESSO HIGH MEMBRA","Accessories",900.0,597.93],["PD-100461","CAFEC Abaca 4CUP","Accessories",195.0,126.0],["PD-100462","CAFEC Abaca 1CUP","Accessories",175.0,112.0],["PD-100463","Felicita ARC","Accessories",4560.0,3300.0],["PD-100464","ชาพีช 500g.","Non-Coffee",130.0,98.99],["PD-100465","ชาพีช 1kg.","Non-Coffee",260.0,180.0],["PD-100466","Doi Pangkhon 500g.","Espresso",342.5,0.0],["PD-100467","Doi Pangkhon (Yor-Chue) 500g.","Espresso",375.0,220.83],["PD-100468","Doi Pangkhon (Yor-Ta) 500g.","Espresso",375.0,220.83],["PD-100469","Milk Choc 1kg. (Nologo)","Espresso",750.0,454.46],["PD-100470","House Blend 500g. (Nologo)","Espresso",300.0,0.0],["PD-100471","Special Blend 500g. (Nologo)","Espresso",375.0,0.0],["PD-100472","บ้านค่าย 500g.","Espresso",360.0,209.73],["PD-100473","บางบุตร 500g.","Espresso",400.0,0.0],["PD-100474","ชากมะหาด 500g.","Espresso",400.0,0.0],["PD-100475","ระยองเบลนด์ 500g.","Espresso",300.0,214.11],["PD-100476","Mae Buh Yah 209 500g. (Nologo)","Espresso",375.0,0.0],["PD-100477","Lao 236 500g. (Nologo)","Espresso",375.0,0.0],["PD-100478","Robusta 245 500g. (Nologo)","Espresso",275.0,0.0],["PD-100479","Early Bird 1kg. (Nologo)","Espresso",490.0,0.0],["PD-100480","ชาไทย(1) 1kg. (Nologo)","Non-Coffee",0.0,0.0],["PD-100481","Nishio Matcha 50g.","Non-Coffee",205.0,103.62],["PD-100482","Nishio Matcha 100g.","Non-Coffee",380.0,196.12],["PD-100483","Nishio Matcha 200g.","Non-Coffee",730.0,385.74],["PD-100484","Nishio Matcha 500g.","Non-Coffee",1750.0,964.77],["PD-100485","Nishio Matcha 1kg","Non-Coffee",3500.0,1905.56],["PD-100486","Mie Matcha 30g.","Non-Coffee",420.0,250.97],["PD-100487","Mie Matcha 50g.","Non-Coffee",520.0,336.15],["PD-100488","Mie Matcha 100g.","Non-Coffee",1010.0,666.74],["PD-100489","Mie Matcha 200g.","Non-Coffee",1990.0,1332.54],["PD-100490","Mie Matcha 500g.","Non-Coffee",4900.0,3328.7],["PD-100491","Mie Matcha 1kg.","Non-Coffee",9800.0,6639.56],["PD-100492","Light Fruit 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100493","Light Fruit 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100494","Light Fruit 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100495","Light Fruit 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100496","Light Fruit 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100497","Light Fruit 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100498","Light Fruit 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100499","Medium Choc 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100500","Medium Choc 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100501","Medium Choc 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100502","Medium Choc 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100503","Medium Choc 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100504","Medium Choc 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100505","Medium Choc 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100506","Dark Choc 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100507","Dark Choc 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100508","Dark Choc 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100509","Dark Choc 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100510","Dark Choc 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100511","Dark Choc 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100512","Dark Choc 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100513","Floral 1000ml.,Light Fruit 200ml","Promotion",300.0,131.58],["PD-100514","Floral 1000ml.,Medium Choc 200ml","Promotion",300.0,131.58],["PD-100515","Floral 1000ml.,Dark Choc 200ml","Promotion",300.0,131.58],["PD-100516","Floral 1000ml.,Floral 200ml.","Promotion",300.0,131.58],["PD-100517","Floral 1000ml.,Honey Lemon 200ml","Promotion",300.0,131.58],["PD-100518","Floral 1000ml.,Berry Forest 200ml","Promotion",300.0,131.58],["PD-100519","Floral 1000ml.,Toffee Caramel 200ml","Promotion",300.0,131.58],["PD-100520","Honey Lemon 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100521","Honey Lemon 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100522","Honey Lemon 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100523","Honey Lemon 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100524","Honey Lemon 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100525","Honey Lemon 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100526","Honey Lemon 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100527","Berry Forest 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100528","Berry Forest 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100529","Berry Forest 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100530","Berry Forest 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100531","Berry Forest 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100532","Berry Forest 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100533","Berry Forest 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100534","Toffee Caramel1000ml,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100535","Toffee Caramel1000ml,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100536","Toffee Caramel1000ml,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100537","Toffee Caramel1000ml,Floral 200ml.","Promotion",380.0,153.63],["PD-100538","Toffee Caramel1000ml,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100539","Toffee Caramel1000ml,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100540","Toffee Caramel1000ml,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100541","Samui 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100542","Samui 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100543","Samui 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100544","Samui 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100545","Samui 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100546","Samui 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100547","Samui 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100548","Blush Fusion 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100549","Blush Fusion 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100550","Blush Fusion 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100551","Blush Fusion 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100552","Blush Fusion 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100553","Blush Fusion 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100554","Blush Fusion 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100555","Tom Yum 1000ml.,Light Fruit 200ml","Promotion",380.0,153.63],["PD-100556","Tom Yum 1000ml.,Medium Choc 200ml","Promotion",380.0,153.63],["PD-100557","Tom Yum 1000ml.,Dark Choc 200ml","Promotion",380.0,153.63],["PD-100558","Tom Yum 1000ml.,Floral 200ml.","Promotion",380.0,153.63],["PD-100559","Tom Yum 1000ml.,Honey Lemon 200ml","Promotion",380.0,153.63],["PD-100560","Tom Yum 1000ml.,Berry Forest 200ml","Promotion",380.0,153.63],["PD-100561","Tom Yum 1000ml.,Toffee Caramel 200ml","Promotion",380.0,153.63],["PD-100562","Mascarada Panama100g","Filter",690.0,250.64],["PD-100563","Mascarada Panama200g","Filter",1200.0,493.14],["PD-100564","แสงสว่าง 500g.","Espresso",300.0,214.11],["PD-100565","ดอยแม่สลอง 100g.","Filter",170.0,49.39],["PD-100566","ดอยแม่สลอง 200g.","Filter",300.0,90.64],["PD-100567","ดอยแม่สลอง M 250g.","Espresso",290.0,98.77],["PD-100568","ดอยแม่สลอง M 500g.","Espresso",370.0,213.48],["PD-100569","ดอยแม่สลอง M 1kg.","Espresso",740.0,426.96],["PD-100570","ดอยแม่สลอง MD 250g.","Espresso",290.0,98.77],["PD-100571","ดอยแม่สลอง MD 500g.","Espresso",370.0,213.48],["PD-100572","ดอยแม่สลอง MD 1kg.","Espresso",740.0,426.96],["PD-100573","พร้อมดื่มBZ Light","Cold Brew",70.0,22.32],["PD-100574","Brazil Light 200ml","Cold Brew",100.0,22.29],["PD-100575","Brazil Light 500ml","Cold Brew",220.0,59.08],["PD-100576","Brazil Light 1000ml","Cold Brew",330.0,107.47],["PD-100577","Brazil Light 5000ml","Cold Brew",1155.0,453.29],["PD-100578","พร้อมดื่มBZ Medium","Cold Brew",70.0,22.32],["PD-100579","Brazil  Medium 200ml","Cold Brew",100.0,22.29],["PD-100580","Brazil  Medium 500ml","Cold Brew",220.0,59.08],["PD-100581","Brazil  Medium 1000ml","Cold Brew",330.0,107.47],["PD-100582","Brazil  Medium 5000ml","Cold Brew",1155.0,453.29],["PD-100583","พร้อมดื่มBZ Dark","Cold Brew",70.0,22.34],["PD-100584","Brazil Dark 200ml","Cold Brew",100.0,22.3],["PD-100585","Brazil Dark 500ml","Cold Brew",220.0,59.12],["PD-100586","Brazil Dark 1000ml","Cold Brew",330.0,107.55],["PD-100587","Brazil Dark 5000ml","Cold Brew",1155.0,453.69],["PD-100588","มัทฉะแม่สลอง 100g","Non-Coffee",150.0,103.9],["PD-100589","มัทฉะแม่สลอง 200g","Non-Coffee",370.0,114.43],["PD-100590","มัทฉะแม่สลอง 500g","Non-Coffee",600.0,283.49],["PD-100591","มัทฉะแม่สลอง 1kg","Non-Coffee",1200.0,549.0],["PD-100592","กากกาแฟ 500g","nan",59.0,5.0],["PD-100593","กากกาแฟ 1kg","nan",89.0,10.0],["PD-100594","กากกาแฟ 5kg","nan",389.0,50.0],["PD-100595","Robusta Dark 500ml.","Cold Brew",150.0,0.0],["PD-100596","Robusta Dark 1000ml.","Cold Brew",250.0,0.0],["PD-100597","Robusta Dark 5000ml.","Cold Brew",1100.0,0.0]];
const PRMAP = {};
PR.forEach(p => { PRMAP[p[0]] = {sku:p[0],name:p[1],cat:p[2],sell:p[3],cost:p[4]}; });
const CATS = ['ทั้งหมด',...Array.from(new Set(PR.map(p=>p[2]))).sort()];
const CAT_LIST = Array.from(new Set(PR.map(p=>p[2]))).sort();
const VAT_RATE = 0.07;

const fmt   = n => Math.round(n).toLocaleString('th-TH');
const fmtD  = n => Number(n).toFixed(2);
const fmtP  = n => Number(n).toFixed(1)+'%';
const thDT  = d => new Date(d).toLocaleString('th-TH',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});

function statType(q,s){ return q===0?'out':q<=s?'low':'ok'; }
function statLabel(t){ return t==='out'?'❌ หมดสต็อก':t==='low'?'⚠️ ใกล้หมด':'✅ ปกติ'; }

// ── Design tokens ────────────────────────────────────────
const T = {
  dark:'#1B3A2D', mid:'#2D5C45', light:'#EFF7F3',
  gold:'#B8860B', goldLight:'#FDF6E3',
  green:'#16A34A', greenLight:'#DCFCE7',
  red:'#DC2626', redLight:'#FEE2E2',
  amber:'#D97706', amberLight:'#FEF3C7',
  blue:'#1D4ED8', blueLight:'#DBEAFE',
  gray:'#6B7280', grayLight:'#F9FAFB',
  border:'#E5E7EB', borderDark:'#D1D5DB',
  white:'#FFFFFF', bg:'#F8FAF9',
  text:'#111827', textMuted:'#6B7280',
  radius:8, radiusLg:12, radiusFull:9999,
};

const S = {
  wrap:{ maxWidth:1200,margin:'0 auto',padding:'0 12px 80px',fontFamily:"'Noto Sans Thai',Arial,sans-serif",fontSize:13,color:T.text,background:T.bg,minHeight:'100vh' },
  hdr:{ background:`linear-gradient(135deg, ${T.dark} 0%, ${T.mid} 100%)`,color:'#EFF7F3',padding:'14px 20px',borderRadius:T.radiusLg,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(27,58,45,0.3)' },
  nav:{ display:'flex',gap:4,marginBottom:16,flexWrap:'wrap',padding:'6px',background:T.white,borderRadius:T.radiusLg,border:`1px solid ${T.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  card:{ background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radiusLg,padding:'1.1rem 1.3rem',marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)' },
  cardTitle:{ fontWeight:600,fontSize:14,color:T.dark,marginBottom:12,display:'flex',alignItems:'center',gap:6 },
  kgrid:{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:10,marginBottom:14 },
  inp:{ padding:'8px 11px',border:`1px solid ${T.borderDark}`,borderRadius:T.radius,fontSize:13,outline:'none',background:T.white,color:T.text,transition:'border-color 0.15s' },
  tbl:{ width:'100%',borderCollapse:'separate',borderSpacing:0,fontSize:12 },
  th:{ background:T.dark,color:'#EFF7F3',padding:'9px 10px',textAlign:'left',fontWeight:500,fontSize:11,letterSpacing:'0.03em' },
  thFirst:{ borderRadius:'6px 0 0 0' }, thLast:{ borderRadius:'0 6px 0 0' },
  tow:{ overflowX:'auto',borderRadius:T.radius,border:`1px solid ${T.border}` },
  row:{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' },
};

const btn=(v='dk',ex={})=>{
  const m={
    dk:{ bg:T.dark,fg:'#EFF7F3',hov:'#243d30' },
    gr:{ bg:T.green,fg:'#fff',hov:'#15803d' },
    rd:{ bg:T.red,fg:'#fff',hov:'#b91c1c' },
    gy:{ bg:'#E5E7EB',fg:'#374151',hov:'#D1D5DB' },
    am:{ bg:T.amber,fg:'#fff',hov:'#b45309' },
    gl:{ bg:T.gold,fg:'#fff',hov:'#a07218' },
    out:{ bg:'transparent',fg:T.dark,hov:T.light,border:`1px solid ${T.dark}` },
  };
  const s=m[v]||m.dk;
  return { padding:'8px 16px',background:s.bg,color:s.fg,border:s.border||'none',borderRadius:T.radius,fontWeight:500,cursor:'pointer',fontSize:13,fontFamily:'inherit',...ex };
};
const nbtn=a=>({ padding:'8px 16px',borderRadius:T.radius,border:'none',background:a?T.dark:'transparent',color:a?'#EFF7F3':T.textMuted,fontWeight:a?500:400,cursor:'pointer',fontSize:13,fontFamily:'inherit',transition:'all 0.15s' });
const tdr=i=>({ padding:'8px 10px',borderBottom:`1px solid ${T.border}`,background:i%2===0?T.grayLight:T.white,fontSize:12 });
const bdg=t=>t==='out'
  ?{ background:T.redLight,color:T.red,borderRadius:T.radiusFull,padding:'3px 10px',fontSize:11,fontWeight:500,display:'inline-block',whiteSpace:'nowrap' }
  :t==='low'
  ?{ background:T.amberLight,color:T.amber,borderRadius:T.radiusFull,padding:'3px 10px',fontSize:11,fontWeight:500,display:'inline-block',whiteSpace:'nowrap' }
  :{ background:T.greenLight,color:T.green,borderRadius:T.radiusFull,padding:'3px 10px',fontSize:11,fontWeight:500,display:'inline-block',whiteSpace:'nowrap' };

// ── KPI Card ──────────────────────────────────────────────
function KPI({label,value,sub,color=T.dark,bg=T.grayLight,icon}){
  return (
    <div style={{...S.card,padding:'14px 16px',marginBottom:0,background:bg,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:4,display:'flex',alignItems:'center',gap:4}}>{icon&&<span>{icon}</span>}{label}</div>
      <div style={{fontSize:22,fontWeight:700,color,lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:T.textMuted,marginTop:3}}>{sub}</div>}
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────
function BarChart({data,vk,lk,color=T.dark,h=140}){
  const max=Math.max(...data.map(d=>d[vk]),1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height:h,paddingTop:8}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
          <div style={{fontSize:9,color:T.textMuted,textAlign:'center'}}>{fmt(d[vk])}</div>
          <div style={{width:'100%',background:color,borderRadius:'4px 4px 0 0',height:Math.max((d[vk]/max)*(h-28),2),transition:'height 0.4s ease'}}/>
          <div style={{fontSize:9,color:T.textMuted,textAlign:'center',maxWidth:52,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d[lk]}</div>
        </div>
      ))}
    </div>
  );
}

// ── XLSX helpers ──────────────────────────────────────────
function useXLSX(){
  const [ok,setOk]=useState(!!window.XLSX);
  useEffect(()=>{
    if(window.XLSX){setOk(true);return;}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload=()=>setOk(true); document.head.appendChild(s);
  },[]);
  return ok;
}
function exportXLSX(filename,sheets){
  const wb=window.XLSX.utils.book_new();
  sheets.forEach(({name,data,headers})=>{
    const ws=window.XLSX.utils.aoa_to_sheet([headers,...data]);
    ws['!cols']=headers.map(h=>({wch:Math.max(h.length*1.8,12)}));
    // Style header row
    const range=window.XLSX.utils.decode_range(ws['!ref']);
    for(let c=range.s.c;c<=range.e.c;c++){
      const cell=ws[window.XLSX.utils.encode_cell({r:0,c})];
      if(cell){ cell.s={fill:{fgColor:{rgb:'1B3A2D'}},font:{color:{rgb:'EFF7F3'},bold:true}}; }
    }
    window.XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));
  });
  window.XLSX.writeFile(wb,filename);
}

// ── Customer Search ───────────────────────────────────────
function CustomerSearch({value,onSelect}){
  const [q,setQ]=useState(''); const [res,setRes]=useState([]); const [loading,setLoading]=useState(false); const [open,setOpen]=useState(false); const timer=useRef();
  const search=async text=>{
    if(!text.trim()){setRes([]);return;}
    setLoading(true);
    const {data}=await supabase.from('customers').select('customer_id,name,contact_phone').or(`name.ilike.%${text}%,customer_id.ilike.%${text}%,contact_phone.ilike.%${text}%`).limit(10);
    setRes(data||[]); setLoading(false);
  };
  return (
    <div style={{position:'relative',flex:1,minWidth:180}}>
      <input style={{...S.inp,width:'100%'}} placeholder="ค้นหาชื่อลูกค้า / รหัส / เบอร์" value={q}
        onChange={e=>{setQ(e.target.value);setOpen(true);clearTimeout(timer.current);timer.current=setTimeout(()=>search(e.target.value),400);}}
        onFocus={()=>q&&setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),200)}/>
      {open&&(res.length>0||loading)&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:T.white,border:`1px solid ${T.border}`,borderRadius:T.radius,zIndex:200,maxHeight:220,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}>
          {loading&&<div style={{padding:'10px 14px',color:T.textMuted,fontSize:12}}>กำลังค้นหา...</div>}
          {res.map(c=>(
            <div key={c.customer_id} style={{padding:'9px 14px',cursor:'pointer',borderBottom:`1px solid ${T.border}`}} onMouseDown={()=>{setQ(c.name);setOpen(false);onSelect(c);}}>
              <div style={{fontWeight:500,fontSize:13}}>{c.name}</div>
              <div style={{color:T.textMuted,fontSize:11}}>{c.customer_id}{c.contact_phone?' · '+c.contact_phone:''}</div>
            </div>
          ))}
        </div>
      )}
      {value&&<div style={{marginTop:4,fontSize:11,color:T.green,fontWeight:500}}>✓ {value.name} ({value.customer_id})</div>}
    </div>
  );
}

// ── Drag & Drop Import Zone ───────────────────────────────
function DropZone({onFile,accept,label,sublabel}){
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const handle=f=>{if(f&&onFile)onFile(f);};
  return (
    <div style={{border:`2px dashed ${drag?T.dark:T.borderDark}`,borderRadius:T.radiusLg,padding:'32px 20px',textAlign:'center',cursor:'pointer',background:drag?T.light:T.grayLight,transition:'all 0.2s'}}
      onClick={()=>ref.current.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)handle(f);}}>
      <div style={{fontSize:32,marginBottom:8}}>📂</div>
      <div style={{fontWeight:600,color:T.dark,marginBottom:4}}>{label}</div>
      <div style={{fontSize:12,color:T.textMuted}}>{sublabel}</div>
      <input ref={ref} type="file" accept={accept} style={{display:'none'}} onChange={e=>handle(e.target.files[0])}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════
function Dashboard({stock,sales}){
  const xlsxOk=useXLSX();
  const m=useMemo(()=>{
    const stVal=PR.reduce((s,p)=>{const d=stock[p[0]]||{qty:0,cost:p[4]};return s+d.qty*d.cost;},0);
    const outN=PR.filter(p=>(stock[p[0]]?.qty||0)===0).length;
    const lowN=PR.filter(p=>{const d=stock[p[0]]||{qty:0,safety:10};return d.qty>0&&d.qty<=d.safety;}).length;
    const now2=new Date();
    const todS=sales.filter(s=>new Date(s.date).toDateString()===now2.toDateString());
    const monS=sales.filter(s=>{const d=new Date(s.date);return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear();});
    const todRev=todS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
    const monRev=monS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
    const todCost=todS.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
    const monCost=monS.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
    return {stVal,outN,lowN,todRev,monRev,todProfit:todRev-todCost,monProfit:monRev-monCost,todTx:todS.length,monTx:monS.length};
  },[stock,sales]);

  const catSales=useMemo(()=>{
    const now2=new Date();
    const monS=sales.filter(s=>{const d=new Date(s.date);return d.getMonth()===now2.getMonth()&&d.getFullYear()===now2.getFullYear();});
    const map={};
    monS.forEach(t=>t.items.forEach(it=>{const cat=PRMAP[it.sku]?.cat||'อื่นๆ';if(!map[cat])map[cat]={cat,rev:0};map[cat].rev+=it.final_price||it.subtotal||0;}));
    return Object.values(map).sort((a,b)=>b.rev-a.rev).slice(0,8);
  },[sales]);

  const daily7=useMemo(()=>{
    const days=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toDateString();const dayS=sales.filter(s=>new Date(s.date).toDateString()===ds);days.push({label:d.toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit'}),rev:dayS.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0)});}
    return days;
  },[sales]);

  const catStock=useMemo(()=>{
    const map={};
    PR.forEach(p=>{const d=stock[p[0]]||{qty:0,cost:p[4]};if(!map[p[2]])map[p[2]]={cat:p[2],items:0,val:0,out:0,low:0};map[p[2]].items++;map[p[2]].val+=d.qty*d.cost;const t=statType(d.qty,d.safety||10);if(t==='out')map[p[2]].out++;else if(t==='low')map[p[2]].low++;});
    return Object.values(map).sort((a,b)=>b.val-a.val);
  },[stock]);

  const alerts=PR.filter(p=>statType(stock[p[0]]?.qty||0,stock[p[0]]?.safety||10)!=='ok').slice(0,15);

  return (
    <div>
      <div style={{...S.row,justifyContent:'space-between',marginBottom:12}}>
        <span style={{fontWeight:600,fontSize:15,color:T.dark}}>ภาพรวมระบบ</span>
        <button style={btn('gr',{fontSize:12})} onClick={()=>xlsxOk&&exportXLSX('dashboard.xlsx',[{name:'KPI',headers:['รายการ','ค่า'],data:[['มูลค่าสต็อก',fmt(m.stVal)],['ยอดขายวันนี้',fmt(m.todRev)],['กำไรวันนี้',fmt(m.todProfit)],['ยอดขายเดือนนี้',fmt(m.monRev)],['กำไรเดือนนี้',fmt(m.monProfit)]]}])} disabled={!xlsxOk}>
          📥 Export
        </button>
      </div>
      <div style={S.kgrid}>
        <KPI label="สินค้าทั้งหมด" value={PR.length+' SKU'} icon="📦" bg={T.blueLight} color={T.blue}/>
        <KPI label="มูลค่าสต็อกรวม" value={'฿'+fmt(m.stVal)} icon="💰" bg={T.greenLight} color={T.green}/>
        <KPI label="ยอดขายวันนี้" value={'฿'+fmt(m.todRev)} sub={m.todTx+' บิล'} icon="💳" bg={T.goldLight} color={T.gold}/>
        <KPI label="กำไรวันนี้" value={'฿'+fmt(m.todProfit)} icon="📈" bg={m.todProfit>=0?T.greenLight:T.redLight} color={m.todProfit>=0?T.green:T.red}/>
        <KPI label="ยอดขายเดือนนี้" value={'฿'+fmt(m.monRev)} sub={m.monTx+' บิล'} icon="📅" bg={T.blueLight} color={T.blue}/>
        <KPI label="กำไรเดือนนี้" value={'฿'+fmt(m.monProfit)} icon="💹" bg={m.monProfit>=0?T.greenLight:T.redLight} color={m.monProfit>=0?T.green:T.red}/>
        <KPI label="หมดสต็อก" value={m.outN+' รายการ'} icon="❌" bg={T.redLight} color={T.red}/>
        <KPI label="ใกล้หมด" value={m.lowN+' รายการ'} icon="⚠️" bg={T.amberLight} color={T.amber}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}><div style={S.cardTitle}>📊 ยอดขาย 7 วันล่าสุด</div><BarChart data={daily7} vk="rev" lk="label" color={T.dark} h={140}/></div>
        <div style={S.card}><div style={S.cardTitle}>📂 ยอดขายแยกหมวด (เดือนนี้)</div>{catSales.length===0?<div style={{textAlign:'center',color:T.textMuted,padding:24}}>ยังไม่มียอดขาย</div>:<BarChart data={catSales} vk="rev" lk="cat" color={T.mid} h={140}/>}</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>📦 สต็อกแยกหมวดหมู่</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['หมวดสินค้า','รายการ','มูลค่าสต็อก (฿)','หมดสต็อก','ใกล้หมด'].map((h,i)=><th key={i} style={{...S.th,...(i===0?S.thFirst:{}),...(i===4?S.thLast:{})}}>{h}</th>)}</tr></thead>
          <tbody>{catStock.map((c,i)=><tr key={c.cat}><td style={{...tdr(i),fontWeight:500}}>{c.cat}</td><td style={tdr(i)}>{c.items}</td><td style={tdr(i)}>฿{fmt(c.val)}</td><td style={{...tdr(i),color:c.out>0?T.red:T.textMuted}}>{c.out>0?c.out:'-'}</td><td style={{...tdr(i),color:c.low>0?T.amber:T.textMuted}}>{c.low>0?c.low:'-'}</td></tr>)}</tbody>
        </table></div>
      </div>
      {alerts.length>0&&<div style={S.card}>
        <div style={S.cardTitle}>⚠️ รายการต้องดูแล ({alerts.length})</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['SKU','ชื่อสินค้า','หมวด','สต็อก','Safety','สถานะ'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{alerts.map((p,i)=>{const d=stock[p[0]]||{qty:0,safety:10};const t=statType(d.qty,d.safety);return <tr key={p[0]}>{[p[0],p[1],p[2],d.qty,d.safety].map((v,j)=><td key={j} style={tdr(i)}>{v}</td>)}<td style={tdr(i)}><span style={bdg(t)}>{statLabel(t)}</span></td></tr>;})}</tbody>
        </table></div>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// STOCK PAGE
// ════════════════════════════════════════════════════════
function StockPage({stock,setStock}){
  const [kw,setKw]=useState('');const [cat,setCat]=useState('ทั้งหมด');const [stF,setStF]=useState('ทั้งหมด');
  const [edits,setEdits]=useState({});const [saving,setSaving]=useState(false);const [msg,setMsg]=useState('');
  const [importMsg,setImportMsg]=useState('');const [importing,setImporting]=useState(false);
  const xlsxOk=useXLSX();

  const filtered=useMemo(()=>{
    const k=kw.toLowerCase().trim();const words=k?k.split(/\s+/).filter(Boolean):[];
    return PR.filter(p=>{
      const hay=(p[0]+' '+p[1]+' '+p[2]+' '+p[3]+' '+p[4]).toLowerCase();
      const mkw=!k||words.every(w=>hay.includes(w));
      const mc=cat==='ทั้งหมด'||p[2]===cat;
      const d=stock[p[0]]||{qty:0,safety:10};const t=statType(d.qty,d.safety);
      const ms=stF==='ทั้งหมด'||(stF==='ปกติ'&&t==='ok')||(stF==='ใกล้หมด'&&t==='low')||(stF==='หมดสต็อก'&&t==='out');
      return mkw&&mc&&ms;
    });
  },[kw,cat,stF,stock]);

  const saveAll=async()=>{
    setSaving(true);setMsg('');
    const updates=Object.entries(edits).map(([sku,v])=>({sku,qty:parseInt(v.qty)||0,safety:parseInt(v.safety)||10,cost:parseFloat(v.cost)||0}));
    const {error}=await supabase.from('stock').upsert(updates,{onConflict:'sku'});
    if(error){setMsg('❌ '+error.message);setSaving(false);return;}
    const ns={...stock};updates.forEach(u=>{ns[u.sku]={qty:u.qty,safety:u.safety,cost:u.cost};});
    setStock(ns);setEdits({});setMsg('✅ บันทึก '+updates.length+' รายการ');setSaving(false);
  };

  // Export stock count template
  const exportTemplate=()=>{
    if(!xlsxOk)return;
    exportXLSX('stock_count_template.xlsx',[{
      name:'นับสต็อก',
      headers:['SKU','ชื่อสินค้า','หมวดสินค้า','ราคาทุน','Safety Stock','จำนวนที่นับได้ (กรอกที่นี่)','หมายเหตุ'],
      data:PR.map(p=>{const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};return[p[0],p[1],p[2],fmtD(d.cost),d.safety,'',''];})
    }]);
  };

  // Import stock count file
  const importStockFile=async file=>{
    if(!xlsxOk||!file)return;
    setImporting(true);setImportMsg('');
    try{
      const buf=await file.arrayBuffer();
      const wb=window.XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      const header=rows[0].map(h=>String(h||'')).map(h=>h.toLowerCase());
      const skuCol=header.findIndex(h=>h.includes('sku'));
      const qtyCol=header.findIndex(h=>h.includes('นับ')||h.includes('จำนวน')||h.includes('qty'));
      const sfCol=header.findIndex(h=>h.includes('safety'));
      if(skuCol<0||qtyCol<0){setImportMsg('❌ ไม่พบคอลัมน์ SKU หรือจำนวน');setImporting(false);return;}
      const updates=[];
      for(let i=1;i<rows.length;i++){
        const row=rows[i];const sku=String(row[skuCol]||'').trim();
        if(!sku||!PRMAP[sku])continue;
        const qty=parseInt(row[qtyCol]);
        if(isNaN(qty)||qty<0)continue;
        const sf=sfCol>=0&&row[sfCol]!==''?parseInt(row[sfCol]):stock[sku]?.safety||10;
        const cost=stock[sku]?.cost||PRMAP[sku].cost;
        updates.push({sku,qty,safety:isNaN(sf)?10:sf,cost});
      }
      if(!updates.length){setImportMsg('❌ ไม่พบข้อมูลที่ valid');setImporting(false);return;}
      const {error}=await supabase.from('stock').upsert(updates,{onConflict:'sku'});
      if(error){setImportMsg('❌ '+error.message);setImporting(false);return;}
      const ns={...stock};updates.forEach(u=>{ns[u.sku]={qty:u.qty,safety:u.safety,cost:u.cost};});
      setStock(ns);setImportMsg('✅ อัพเดทสต็อก '+updates.length+' รายการเรียบร้อย!');
    }catch(e){setImportMsg('❌ อ่านไฟล์ไม่ได้: '+e.message);}
    setImporting(false);
  };

  // Export stock report
  const exportStock=()=>{
    if(!xlsxOk)return;
    const sheets=[{name:'สต็อกทั้งหมด',headers:['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่าสต็อก','สถานะ'],data:PR.map((p,i)=>{const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};return[i+1,p[0],p[1],p[2],p[3],fmtD(d.cost),d.qty,d.safety,Math.round(d.qty*d.cost),statLabel(statType(d.qty,d.safety))];})},
    ...CAT_LIST.map(c=>({name:c.slice(0,31),headers:['SKU','ชื่อสินค้า','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่าสต็อก','สถานะ'],data:PR.filter(p=>p[2]===c).map(p=>{const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};return[p[0],p[1],p[3],fmtD(d.cost),d.qty,d.safety,Math.round(d.qty*d.cost),statLabel(statType(d.qty,d.safety))];})}))]
    exportXLSX('stock_report.xlsx',sheets);
  };

  return (
    <div>
      {/* Import/Export Tools */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}>
          <div style={S.cardTitle}>📥 นำเข้าข้อมูลสต็อก (ลากวางไฟล์)</div>
          <DropZone onFile={importStockFile} accept=".xlsx,.xls,.csv" label="ลากไฟล์ Excel มาวางที่นี่" sublabel="รองรับไฟล์ .xlsx .xls .csv | ดาวน์โหลด template ก่อนกรอก"/>
          {importing&&<div style={{marginTop:8,color:T.textMuted,fontSize:12}}>⏳ กำลังประมวลผล...</div>}
          {importMsg&&<div style={{marginTop:8,padding:'8px 12px',borderRadius:T.radius,fontSize:12,background:importMsg.startsWith('✅')?T.greenLight:T.redLight,color:importMsg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{importMsg}</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>📤 ดาวน์โหลด</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button style={{...btn('dk'),textAlign:'left'}} onClick={exportTemplate} disabled={!xlsxOk}>📋 Template นับสต็อก (กรอกแล้ว import กลับได้)</button>
            <button style={{...btn('out'),textAlign:'left'}} onClick={exportStock} disabled={!xlsxOk}>📊 รายงานสต็อกแยกหมวด Excel</button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={S.card}>
        <div style={{...S.row,gap:8}}>
          <input style={{...S.inp,flex:2,minWidth:160}} placeholder="ค้นหาชื่อ / SKU / ราคา (หลายคำคั่นช่องว่าง)" value={kw} onChange={e=>setKw(e.target.value)}/>
          <select style={S.inp} value={cat} onChange={e=>setCat(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
          <select style={S.inp} value={stF} onChange={e=>setStF(e.target.value)}>{['ทั้งหมด','ปกติ','ใกล้หมด','หมดสต็อก'].map(s=><option key={s}>{s}</option>)}</select>
          <span style={{fontSize:12,color:T.textMuted,whiteSpace:'nowrap'}}>พบ {filtered.length} รายการ</span>
        </div>
      </div>

      {Object.keys(edits).length>0&&(
        <div style={{...S.card,background:T.greenLight,border:`1px solid ${T.green}`}}>
          <div style={S.row}>
            <button style={btn('gr')} onClick={saveAll} disabled={saving}>{saving?'กำลังบันทึก...':`💾 บันทึก ${Object.keys(edits).length} รายการ`}</button>
            <button style={btn('gy')} onClick={()=>setEdits({})}>ยกเลิก</button>
            {msg&&<span style={{fontSize:12,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{msg}</span>}
          </div>
        </div>
      )}

      <div style={S.tow}>
        <table style={S.tbl}>
          <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก','Safety','มูลค่า','สถานะ','แก้ไข'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((p,i)=>{
              const d=stock[p[0]]||{qty:0,safety:10,cost:p[4]};const t=statType(d.qty,d.safety);const ed=edits[p[0]];
              return <tr key={p[0]}>
                <td style={tdr(i)}>{i+1}</td>
                <td style={{...tdr(i),color:T.blue,fontWeight:600}}>{p[0]}</td>
                <td style={tdr(i)}>{p[1]}</td>
                <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{p[2]}</td>
                <td style={tdr(i)}>฿{fmt(p[3])}</td>
                <td style={tdr(i)}>฿{fmtD(ed?ed.cost:d.cost)}</td>
                <td style={tdr(i)}>{ed?<input type="number" min="0" style={{...S.inp,width:70,padding:'4px 6px',borderColor:T.blue,background:T.blueLight,color:T.blue,fontWeight:600,textAlign:'center'}} value={ed.qty} onChange={e=>setEdits(v=>({...v,[p[0]]:{...v[p[0]],qty:e.target.value}}))}/>:<b style={{color:T.blue}}>{d.qty}</b>}</td>
                <td style={tdr(i)}>{ed?<input type="number" min="0" style={{...S.inp,width:60,padding:'4px 6px',borderColor:T.amber,background:T.amberLight,color:T.amber,textAlign:'center'}} value={ed.safety} onChange={e=>setEdits(v=>({...v,[p[0]]:{...v[p[0]],safety:e.target.value}}))}/>:d.safety}</td>
                <td style={tdr(i)}>฿{fmt(d.qty*d.cost)}</td>
                <td style={tdr(i)}><span style={bdg(t)}>{statLabel(t)}</span></td>
                <td style={tdr(i)}>{ed?<button style={btn('gy',{padding:'3px 10px',fontSize:11})} onClick={()=>setEdits(v=>{const n={...v};delete n[p[0]];return n;})}>✕</button>:<button style={btn('dk',{padding:'3px 10px',fontSize:11})} onClick={()=>{const d2=stock[p[0]]||{qty:0,safety:10,cost:p[4]};setEdits(v=>({...v,[p[0]]:{qty:d2.qty,safety:d2.safety,cost:d2.cost}}));}}>แก้ไข</button>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SALES PAGE — ราคาแก้ได้ + ส่วนลด + VAT
// ════════════════════════════════════════════════════════
function SalesPage({stock,setStock,setSales}){
  const [kw,setKw]=useState('');
  const [cart,setCart]=useState([]);
  const [customer,setCustomer]=useState(null);
  const [note,setNote]=useState('');
  const [channel,setChannel]=useState('In-store');
  const [vat,setVat]=useState(false);
  const [globalDisc,setGlobalDisc]=useState('');
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const [importMsg,setImportMsg]=useState('');
  const [importing,setImporting]=useState(false);
  const xlsxOk=useXLSX();

  const sugs=useMemo(()=>{
    if(!kw.trim())return[];
    const words=kw.toLowerCase().split(/\s+/).filter(Boolean);
    return PR.filter(p=>{const hay=(p[0]+' '+p[1]+' '+p[2]).toLowerCase();return words.every(w=>hay.includes(w));}).slice(0,15);
  },[kw]);

  const addToCart=p=>{
    setCart(c=>{const ex=c.find(x=>x.sku===p[0]);if(ex)return c.map(x=>x.sku===p[0]?{...x,qty:x.qty+1}:x);return[...c,{sku:p[0],name:p[1],cat:p[2],unitPrice:p[3],sell:p[3],cost:stock[p[0]]?.cost||p[4],qty:1,discount:0}];});
    setKw('');
  };

  const updateCart=(sku,field,val)=>{
    setCart(c=>c.map(x=>{if(x.sku!==sku)return x;const updated={...x,[field]:field==='qty'?Math.max(1,parseInt(val)||1):field==='sell'?parseFloat(val)||0:parseFloat(val)||0};return updated;}));
  };

  // Calculate totals
  const subtotal=cart.reduce((s,x)=>s+x.sell*x.qty,0);
  const discAmt=globalDisc?parseFloat(globalDisc)||0:0;
  const afterDisc=Math.max(0,subtotal-discAmt);
  const vatAmt=vat?afterDisc*VAT_RATE:0;
  const grandTotal=afterDisc+vatAmt;
  const totalCost=cart.reduce((s,x)=>s+(x.cost||0)*x.qty,0);
  const profit=afterDisc-totalCost;

  const confirmSale=async()=>{
    if(!cart.length)return;
    setSaving(true);setMsg('');
    const items=cart.map(x=>({sku:x.sku,name:x.name,cat:x.cat,qty:x.qty,unit_price:x.unitPrice,sell:x.sell,discount_per_item:x.discount||0,cost:x.cost,subtotal:x.sell*x.qty}));
    const saleData={items,total:subtotal,discount_amount:discAmt,total_after_discount:afterDisc,vat_amount:vatAmt,total_after_vat:grandTotal,note,channel,customer_id:customer?.customer_id||null,customer_name:customer?.name||null};
    const {error:sErr}=await supabase.from('sales').insert([saleData]);
    if(sErr){setMsg('❌ '+sErr.message);setSaving(false);return;}
    const ns={...stock};const ups=[];
    for(const it of items){const cur=ns[it.sku]?.qty||0;ns[it.sku]={...(ns[it.sku]||{}),qty:Math.max(0,cur-it.qty)};ups.push({sku:it.sku,qty:ns[it.sku].qty,safety:ns[it.sku]?.safety||10,cost:ns[it.sku]?.cost||0});}
    await supabase.from('stock').upsert(ups,{onConflict:'sku'});
    setStock(ns);setSales(s=>[...s,saleData]);
    setCart([]);setNote('');setCustomer(null);setGlobalDisc('');
    setMsg('✅ บันทึกการขาย ฿'+fmt(grandTotal)+(vat?' (รวม VAT)':'')+' — ตัดสต็อกแล้ว');
    setSaving(false);
  };

  // Import sale file
  const importSaleFile=async file=>{
    if(!xlsxOk||!file)return;
    setImporting(true);setImportMsg('');
    try{
      const buf=await file.arrayBuffer();
      const wb=window.XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      const header=rows[0].map(h=>String(h||'')).toLowerCase?rows[0].map(h=>String(h||'').toLowerCase()):[];
      const skuCol=header.findIndex(h=>h.includes('sku'));
      const qtyCol=header.findIndex(h=>h.includes('จำนวน')||h.includes('qty'));
      const priceCol=header.findIndex(h=>h.includes('ราคา')||h.includes('price'));
      if(skuCol<0||qtyCol<0){setImportMsg('❌ ไม่พบคอลัมน์ SKU หรือจำนวน');setImporting(false);return;}
      const newItems=[];
      for(let i=1;i<rows.length;i++){
        const row=rows[i];const sku=String(row[skuCol]||'').trim();
        if(!sku||!PRMAP[sku])continue;
        const qty=parseInt(row[qtyCol]);if(isNaN(qty)||qty<=0)continue;
        const p=PRMAP[sku];
        const sell=priceCol>=0&&row[priceCol]!==''?parseFloat(row[priceCol])||p.sell:p.sell;
        newItems.push({sku,name:p.name,cat:p.cat,unitPrice:p.sell,sell,cost:stock[sku]?.cost||p.cost,qty,discount:0});
      }
      if(!newItems.length){setImportMsg('❌ ไม่พบข้อมูลที่ valid');setImporting(false);return;}
      setCart(newItems);setImportMsg('✅ โหลด '+newItems.length+' รายการ — ตรวจสอบแล้วกด ยืนยันการขาย');
    }catch(e){setImportMsg('❌ '+e.message);}
    setImporting(false);
  };

  // Export sale template
  const exportSaleTemplate=()=>{
    if(!xlsxOk)return;
    exportXLSX('sale_template.xlsx',[{name:'บันทึกขาย',headers:['SKU','ชื่อสินค้า','หมวด','ราคาขาย','จำนวน','ราคาที่ขายจริง (ถ้าต่างจากราคาปกติ)'],data:PR.slice(0,20).map(p=>[p[0],p[1],p[2],p[3],'',''])}]);
  };

  return (
    <div>
      {/* Import sale file */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <div style={S.card}>
          <div style={S.cardTitle}>📥 นำเข้าไฟล์ขาย (ลากวาง)</div>
          <DropZone onFile={importSaleFile} accept=".xlsx,.xls,.csv" label="ลากไฟล์ Excel รายการขายมาวาง" sublabel="ระบบจะโหลดรายการเข้าตะกร้าอัตโนมัติ"/>
          {importing&&<div style={{marginTop:8,fontSize:12,color:T.textMuted}}>⏳ กำลังโหลด...</div>}
          {importMsg&&<div style={{marginTop:8,padding:'8px 12px',borderRadius:T.radius,fontSize:12,background:importMsg.startsWith('✅')?T.greenLight:T.redLight,color:importMsg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{importMsg}</div>}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>📋 Template ไฟล์ขาย</div>
          <button style={{...btn('dk'),width:'100%',textAlign:'left'}} onClick={exportSaleTemplate} disabled={!xlsxOk}>📥 ดาวน์โหลด Template ไฟล์ขาย</button>
          <div style={{marginTop:8,fontSize:11,color:T.textMuted,lineHeight:1.6}}>กรอก SKU + จำนวน → save → ลากมาวาง → ระบบโหลดเข้าตะกร้าให้อัตโนมัติ</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,320px)',gap:12}}>
        <div>
          {/* Search */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔍 ค้นหาสินค้า</div>
            <input style={{...S.inp,width:'100%'}} placeholder="พิมพ์ชื่อสินค้า หรือ รหัส SKU" value={kw} onChange={e=>setKw(e.target.value)} autoComplete="off"/>
            {sugs.length>0&&(
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                {sugs.map(p=>(
                  <button key={p[0]} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:T.radius,background:T.grayLight,cursor:'pointer',fontSize:12,textAlign:'left',transition:'background 0.1s'}} onClick={()=>addToCart(p)}>
                    <span style={{fontWeight:600,color:T.dark}}>{p[1]}</span>
                    <span style={{color:T.green,marginLeft:6,fontSize:11}}>({stock[p[0]]?.qty||0})</span>
                    <span style={{color:T.textMuted,marginLeft:4}}>฿{fmt(p[3])}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length>0&&(
            <div style={S.card}>
              <div style={S.cardTitle}>🛒 รายการในบิล</div>
              <div style={S.tow}>
                <table style={S.tbl}>
                  <thead><tr>{['ชื่อสินค้า','ราคา/หน่วย','จำนวน','รวม',''].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {cart.map((x,i)=>(
                      <tr key={x.sku}>
                        <td style={tdr(i)}>
                          <div style={{fontWeight:500}}>{x.name}</div>
                          <div style={{fontSize:10,color:T.textMuted}}>{x.sku} · {x.cat}</div>
                        </td>
                        <td style={tdr(i)}>
                          <input type="number" min="0" step="0.01" style={{...S.inp,width:90,padding:'4px 6px',borderColor:x.sell!==x.unitPrice?T.amber:T.borderDark,fontWeight:x.sell!==x.unitPrice?600:400}} value={x.sell} onChange={e=>updateCart(x.sku,'sell',e.target.value)}/>
                          {x.sell!==x.unitPrice&&<div style={{fontSize:10,color:T.amber}}>ปกติ ฿{fmt(x.unitPrice)}</div>}
                        </td>
                        <td style={tdr(i)}><input type="number" min="1" style={{...S.inp,width:65,padding:'4px 6px',textAlign:'center'}} value={x.qty} onChange={e=>updateCart(x.sku,'qty',e.target.value)}/></td>
                        <td style={{...tdr(i),fontWeight:500}}>฿{fmt(x.sell*x.qty)}</td>
                        <td style={tdr(i)}><button style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:18,lineHeight:1}} onClick={()=>setCart(c=>c.filter(it=>it.sku!==x.sku))}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary panel */}
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>💰 สรุปบิล</div>

            {/* VAT toggle */}
            <div style={{...S.row,marginBottom:12,padding:'10px 12px',background:T.grayLight,borderRadius:T.radius}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',flex:1}}>
                <input type="checkbox" checked={vat} onChange={e=>setVat(e.target.checked)} style={{width:16,height:16}}/>
                <span style={{fontWeight:500}}>คิด VAT 7%</span>
              </label>
            </div>

            {/* Totals */}
            <div style={{background:T.grayLight,borderRadius:T.radius,padding:'12px 14px',marginBottom:12}}>
              {[
                ['ราคารวม','฿'+fmt(subtotal)],
                ...(discAmt>0?[['ส่วนลด','-฿'+fmt(discAmt)]]:[] ),
                ...(vat?[['ก่อนภาษี','฿'+fmt(afterDisc)],['VAT 7%','฿'+fmt(vatAmt)]]:[] ),
              ].map(([l,v],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0',color:l==='ส่วนลด'?T.red:T.text}}><span>{l}</span><span>{v}</span></div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:20,marginTop:8,paddingTop:8,borderTop:`2px solid ${T.border}`,color:T.dark}}>
                <span>ยอดรวม</span><span>฿{fmt(grandTotal)}</span>
              </div>
              <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>กำไรโดยประมาณ ฿{fmt(profit)} ({subtotal>0?fmtP(profit/subtotal*100):'0%'})</div>
            </div>

            {/* Discount */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>ส่วนลด (฿)</div>
            <input type="number" min="0" style={{...S.inp,width:'100%',marginBottom:10}} placeholder="0" value={globalDisc} onChange={e=>setGlobalDisc(e.target.value)}/>

            {/* Customer */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>ลูกค้า</div>
            <CustomerSearch value={customer} onSelect={setCustomer}/>

            {/* Channel */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4,marginTop:10}}>ช่องทางขาย</div>
            <select style={{...S.inp,width:'100%',marginBottom:8}} value={channel} onChange={e=>setChannel(e.target.value)}>
              {['In-store','Shopee','Lazada','LINE','Facebook','TikTok','Line Man','Grab','อื่นๆ'].map(c=><option key={c}>{c}</option>)}
            </select>

            {/* Note */}
            <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>หมายเหตุ</div>
            <input style={{...S.inp,width:'100%',marginBottom:14}} placeholder="หมายเหตุเพิ่มเติม..." value={note} onChange={e=>setNote(e.target.value)}/>

            <button style={{...btn('gr'),width:'100%',padding:'13px 0',fontSize:15,borderRadius:T.radius}} onClick={confirmSale} disabled={!cart.length||saving}>
              {saving?'กำลังบันทึก...':`✅ ยืนยันการขาย ${vat?'(รวม VAT)':''}`}
            </button>
            {msg&&<div style={{marginTop:10,padding:'9px 12px',borderRadius:T.radius,fontSize:12,background:msg.startsWith('✅')?T.greenLight:T.redLight,color:msg.startsWith('✅')?T.green:T.red,fontWeight:500}}>{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// REPORT PAGE
// ════════════════════════════════════════════════════════
function ReportPage({sales}){
  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth();

  // Period state
  const [period, setPeriod]     = useState('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const xlsxOk = useXLSX();

  // Build year list (current year back to 5 years)
  const years = Array.from({length:6},(_,i)=>thisYear-i);

  // Period definitions
  const PERIODS = [
    {v:'today',     l:'วันนี้'},
    {v:'yesterday', l:'เมื่อวาน'},
    {v:'this_week', l:'สัปดาห์นี้'},
    {v:'last_week', l:'สัปดาห์ที่แล้ว'},
    {v:'this_month',l:'เดือนนี้'},
    {v:'last_month',l:'เดือนที่แล้ว'},
    {v:'this_year', l:'ปีนี้'},
    {v:'last_year', l:'ปีที่แล้ว'},
    {v:'custom',    l:'กำหนดเอง'},
  ];

  // Month pickers for quick monthly jump
  const [quickMonth, setQuickMonth] = useState(
    thisYear+'-'+(thisMonth+1).toString().padStart(2,'0')
  );
  const [quickYear, setQuickYear] = useState(String(thisYear));

  // Filter function
  const filtered = useMemo(()=>{
    const n  = new Date();
    const today     = new Date(n.getFullYear(),n.getMonth(),n.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay());
    const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(weekStart.getDate()-7);
    const lastWeekEnd   = new Date(weekStart); lastWeekEnd.setDate(weekStart.getDate()-1);
    const monthStart = new Date(n.getFullYear(),n.getMonth(),1);
    const lastMonthStart = new Date(n.getFullYear(),n.getMonth()-1,1);
    const lastMonthEnd   = new Date(n.getFullYear(),n.getMonth(),0);
    const yearStart  = new Date(n.getFullYear(),0,1);
    const lastYearStart = new Date(n.getFullYear()-1,0,1);
    const lastYearEnd   = new Date(n.getFullYear()-1,11,31);

    return sales.filter(s=>{
      const d = new Date(s.date);
      if(period==='today')      return d>=today;
      if(period==='yesterday')  return d>=yesterday && d<today;
      if(period==='this_week')  return d>=weekStart;
      if(period==='last_week')  return d>=lastWeekStart && d<=lastWeekEnd;
      if(period==='this_month') return d>=monthStart;
      if(period==='last_month') return d>=lastMonthStart && d<=lastMonthEnd;
      if(period==='this_year')  return d>=yearStart;
      if(period==='last_year')  return d>=lastYearStart && d<=lastYearEnd;
      if(period==='month_pick'){
        const [y,m]=quickMonth.split('-');
        return d.getFullYear()===parseInt(y)&&d.getMonth()===parseInt(m)-1;
      }
      if(period==='year_pick')  return d.getFullYear()===parseInt(quickYear);
      if(period==='custom'&&customStart&&customEnd){
        const cs=new Date(customStart); const ce=new Date(customEnd); ce.setHours(23,59,59);
        return d>=cs&&d<=ce;
      }
      return true;
    });
  },[sales,period,customStart,customEnd,quickMonth,quickYear]);

  // Metrics
  const revenue = filtered.reduce((s,t)=>s+(t.total_after_vat||t.total||0),0);
  const cost    = filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0),0);
  const profit  = revenue-cost;
  const margin  = revenue>0?profit/revenue*100:0;
  const vatTotal  = filtered.reduce((s,t)=>s+(t.vat_amount||0),0);
  const discTotal = filtered.reduce((s,t)=>s+(t.discount_amount||0),0);

  // Category breakdown
  const catMap={};
  filtered.forEach(t=>t.items.forEach(it=>{
    const cat=PRMAP[it.sku]?.cat||'อื่นๆ';
    if(!catMap[cat])catMap[cat]={cat,qty:0,rev:0,cost:0};
    catMap[cat].qty+=it.qty; catMap[cat].rev+=it.subtotal||0; catMap[cat].cost+=(it.cost||0)*it.qty;
  }));
  const catRows=Object.values(catMap).map(c=>({...c,profit:c.rev-c.cost,margin:c.rev>0?(c.rev-c.cost)/c.rev*100:0})).sort((a,b)=>b.rev-a.rev);

  // Top products
  const skuMap={};
  filtered.forEach(t=>t.items.forEach(it=>{
    if(!skuMap[it.sku])skuMap[it.sku]={sku:it.sku,name:it.name,cat:PRMAP[it.sku]?.cat||'อื่นๆ',qty:0,rev:0,cost:0};
    skuMap[it.sku].qty+=it.qty; skuMap[it.sku].rev+=it.subtotal||0; skuMap[it.sku].cost+=(it.cost||0)*it.qty;
  }));
  const topItems=Object.values(skuMap).map(r=>({...r,profit:r.rev-r.cost})).sort((a,b)=>b.rev-a.rev).slice(0,20);

  // Period label for export filename
  const periodLabel = ()=>{
    const m={'today':'วันนี้','yesterday':'เมื่อวาน','this_week':'สัปดาห์นี้','last_week':'สัปดาห์ที่แล้ว','this_month':'เดือนนี้','last_month':'เดือนที่แล้ว','this_year':'ปีนี้','last_year':'ปีที่แล้ว','month_pick':quickMonth,'year_pick':quickYear,'custom':`${customStart}_${customEnd}`};
    return m[period]||period;
  };

  const exportReport=()=>{
    if(!xlsxOk)return;
    exportXLSX(`report_${periodLabel()}.xlsx`,[
      {name:'กำไร-ขาดทุน',headers:['รายการ','ยอด (฿)'],
       data:[['ช่วงเวลา',periodLabel()],['ยอดขายรวม',Math.round(revenue)],['ส่วนลดรวม',Math.round(discTotal)],['VAT รวม',Math.round(vatTotal)],['ต้นทุนสินค้า',Math.round(cost)],['กำไรขั้นต้น',Math.round(profit)],['Gross Margin %',fmtP(margin)],['จำนวนบิล',filtered.length],['ชิ้นที่ขาย',filtered.reduce((s,t)=>s+t.items.reduce((a,b)=>a+b.qty,0),0)]]},
      {name:'แยกหมวดสินค้า',headers:['หมวด','ชิ้น','ยอดขาย','ต้นทุน','กำไร','Margin %'],
       data:catRows.map(c=>[c.cat,c.qty,Math.round(c.rev),Math.round(c.cost),Math.round(c.profit),fmtP(c.margin)])},
      {name:'สินค้าขายดี',headers:['#','SKU','ชื่อ','หมวด','ชิ้น','ยอดขาย','กำไร'],
       data:topItems.map((r,i)=>[i+1,r.sku,r.name,r.cat,r.qty,Math.round(r.rev),Math.round(r.profit)])},
      {name:'ประวัติบิล',headers:['วันที่','ลูกค้า','ช่องทาง','ยอดรวม','ส่วนลด','VAT','ยอดสุทธิ','ต้นทุน','กำไร','หมายเหตุ'],
       data:filtered.slice().reverse().map(s=>{const c=s.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0);return[thDT(s.date),s.customer_name||'-',s.channel||'-',Math.round(s.total||0),Math.round(s.discount_amount||0),Math.round(s.vat_amount||0),Math.round(s.total_after_vat||s.total||0),Math.round(c),Math.round((s.total_after_vat||s.total||0)-c),s.note||''];})},
    ]);
  };

  return(
    <div>
      {/* Period selector */}
      <div style={S.card}>
        <div style={S.cardTitle}>📅 เลือกช่วงเวลา</div>

        {/* Quick periods */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {PERIODS.map(p=>(
            <button key={p.v} style={{...nbtn(period===p.v),padding:'7px 13px',fontSize:12}} onClick={()=>setPeriod(p.v)}>{p.l}</button>
          ))}
        </div>

        {/* Month picker */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:12,color:T.textMuted,whiteSpace:'nowrap'}}>เลือกเดือน:</span>
          <input type="month" style={{...S.inp,fontSize:12}} value={quickMonth}
            onChange={e=>{setQuickMonth(e.target.value);setPeriod('month_pick');}}/>
          <span style={{fontSize:12,color:T.textMuted,whiteSpace:'nowrap'}}>เลือกปี:</span>
          <select style={{...S.inp,fontSize:12}} value={quickYear}
            onChange={e=>{setQuickYear(e.target.value);setPeriod('year_pick');}}>
            {years.map(y=><option key={y} value={y}>{y+543} (ค.ศ. {y})</option>)}
          </select>
        </div>

        {/* Custom range */}
        {period==='custom'&&(
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',padding:'10px 12px',background:T.blueLight,borderRadius:T.radius}}>
            <span style={{fontSize:12,fontWeight:500,color:T.blue}}>ตั้งแต่:</span>
            <input type="date" style={{...S.inp,fontSize:12}} value={customStart} onChange={e=>setCustomStart(e.target.value)}/>
            <span style={{fontSize:12,color:T.textMuted}}>ถึง:</span>
            <input type="date" style={{...S.inp,fontSize:12}} value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/>
          </div>
        )}

        {/* Summary line */}
        <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:T.textMuted}}>
            📊 พบ <b style={{color:T.dark}}>{filtered.length}</b> บิล ในช่วง <b style={{color:T.dark}}>{periodLabel()}</b>
          </span>
          <button style={btn('gr',{fontSize:12,padding:'7px 14px'})} onClick={exportReport} disabled={!xlsxOk||!filtered.length}>
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* PnL */}
      <div style={S.card}>
        <div style={S.cardTitle}>📊 สรุปกำไร-ขาดทุน</div>
        <div style={S.kgrid}>
          <KPI label="ยอดขายรวม"   value={'฿'+fmt(revenue)}   icon="💰" bg={T.blueLight}  color={T.blue}/>
          <KPI label="ส่วนลดรวม"   value={'฿'+fmt(discTotal)} icon="🏷️" bg={T.amberLight} color={T.amber}/>
          <KPI label="VAT รวม"      value={'฿'+fmt(vatTotal)}  icon="🧾" bg={T.grayLight}  color={T.gray}/>
          <KPI label="ต้นทุนสินค้า" value={'฿'+fmt(cost)}      icon="📦" bg={T.amberLight} color={T.amber}/>
          <KPI label="กำไรขั้นต้น"  value={'฿'+fmt(profit)}    icon="📈" bg={profit>=0?T.greenLight:T.redLight} color={profit>=0?T.green:T.red}/>
          <KPI label="Gross Margin"  value={fmtP(margin)}       icon="%" bg={margin>=30?T.greenLight:margin>=10?T.amberLight:T.redLight} color={margin>=30?T.green:margin>=10?T.amber:T.red}/>
        </div>
      </div>

      {/* By category */}
      <div style={S.card}>
        <div style={S.cardTitle}>📂 กำไรแยกหมวดสินค้า</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['หมวด','ชิ้น','ยอดขาย','ต้นทุน','กำไร','Margin %'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{catRows.length===0
            ?<tr><td colSpan={6} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:24}}>ยังไม่มีข้อมูลในช่วงเวลานี้</td></tr>
            :catRows.map((c,i)=>(
              <tr key={c.cat}>
                <td style={{...tdr(i),fontWeight:500}}>{c.cat}</td>
                <td style={tdr(i)}>{c.qty}</td>
                <td style={tdr(i)}>฿{fmt(c.rev)}</td>
                <td style={tdr(i)}>฿{fmt(c.cost)}</td>
                <td style={{...tdr(i),color:c.profit>=0?T.green:T.red,fontWeight:500}}>฿{fmt(c.profit)}</td>
                <td style={{...tdr(i),color:c.margin>=30?T.green:c.margin>=10?T.amber:T.red,fontWeight:500}}>{fmtP(c.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Top products */}
      {topItems.length>0&&(
        <div style={S.card}>
          <div style={S.cardTitle}>🏆 สินค้าขายดี Top 20</div>
          <div style={S.tow}><table style={S.tbl}>
            <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ชิ้น','ยอดขาย','กำไร'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{topItems.map((r,i)=>(
              <tr key={r.sku}>
                <td style={tdr(i)}>{i+1}</td>
                <td style={{...tdr(i),color:T.blue,fontWeight:600}}>{r.sku}</td>
                <td style={tdr(i)}>{r.name}</td>
                <td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{r.cat}</td>
                <td style={tdr(i)}>{r.qty}</td>
                <td style={tdr(i)}>฿{fmt(r.rev)}</td>
                <td style={{...tdr(i),color:r.profit>=0?T.green:T.red}}>฿{fmt(r.profit)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      )}

      {/* Bill history */}
      <div style={S.card}>
        <div style={{...S.cardTitle,justifyContent:'space-between'}}>
          <span>🧾 ประวัติบิล ({filtered.length} รายการ)</span>
          {filtered.length>50&&<span style={{fontSize:11,color:T.textMuted,fontWeight:400}}>แสดง 50 รายการล่าสุด</span>}
        </div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['วันที่','ลูกค้า','ช่องทาง','ยอดสุทธิ','VAT','กำไร','หมายเหตุ'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{filtered.length===0
            ?<tr><td colSpan={7} style={{...tdr(0),textAlign:'center',color:T.textMuted,padding:24}}>ไม่มีบิลในช่วงเวลานี้</td></tr>
            :filtered.slice(0,50).map((s,i)=>{
              const c=s.items.reduce((a,b)=>a+(b.cost||0)*b.qty,0);
              const net=s.total_after_vat||s.total||0;
              return(
                <tr key={s.id||i}>
                  <td style={{...tdr(i),whiteSpace:'nowrap'}}>{thDT(s.date)}</td>
                  <td style={tdr(i)}>{s.customer_name||'-'}</td>
                  <td style={tdr(i)}>{s.channel||'-'}</td>
                  <td style={{...tdr(i),fontWeight:500}}>฿{fmt(net)}</td>
                  <td style={{...tdr(i),color:T.textMuted,fontSize:11}}>{s.vat_amount?'฿'+fmt(s.vat_amount):'-'}</td>
                  <td style={{...tdr(i),color:(net-c)>=0?T.green:T.red}}>฿{fmt(net-c)}</td>
                  <td style={{...tdr(i),color:T.textMuted,fontSize:11}}>{s.note||''}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function PlanPage({stock,sales}){
  const [days,setDays]=useState(7);const [buf,setBuf]=useState(20);const xlsxOk=useXLSX();
  const plan=useMemo(()=>{
    const cutoff=new Date(Date.now()-days*86400000);
    const skuS={};
    sales.filter(s=>new Date(s.date)>=cutoff).forEach(t=>t.items.forEach(it=>{skuS[it.sku]=(skuS[it.sku]||0)+it.qty;}));
    return Object.entries(skuS).map(([sku,sold])=>{
      const p=PRMAP[sku];if(!p)return null;
      const cur=stock[sku]?.qty||0;const daily=sold/days;const proj=Math.ceil(daily*14*(1+buf/100));const need=Math.max(0,proj-cur);
      return need>0?{sku,name:p.name,cat:p.cat,sold,daily,cur,proj,need}:null;
    }).filter(Boolean).sort((a,b)=>b.need-a.need);
  },[sales,stock,days,buf]);

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>⚙️ ตั้งค่าแผนการผลิต</div>
        <div style={{...S.row,gap:20,flexWrap:'wrap'}}>
          <div><div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>คำนวณจากยอดขาย</div><select style={S.inp} value={days} onChange={e=>setDays(Number(e.target.value))}>{[3,7,14,30].map(d=><option key={d} value={d}>{d} วัน</option>)}</select></div>
          <div><div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Buffer %</div><select style={S.inp} value={buf} onChange={e=>setBuf(Number(e.target.value))}>{[0,10,20,30,50].map(b=><option key={b} value={b}>{b}%</option>)}</select></div>
          <div style={{fontSize:12,color:T.textMuted,alignSelf:'flex-end',paddingBottom:6}}>คำนวณสำหรับ 14 วันข้างหน้า</div>
          {plan.length>0&&<button style={{...btn('gr',{fontSize:12}),alignSelf:'flex-end',marginBottom:1}} onClick={()=>xlsxOk&&exportXLSX('production_plan.xlsx',[{name:'แผนผลิต',headers:['#','SKU','ชื่อสินค้า','หมวด','ขายใน '+days+'วัน','ขาย/วัน','สต็อก','ต้องผลิต'],data:plan.map((r,i)=>[i+1,r.sku,r.name,r.cat,r.sold,r.daily.toFixed(1),r.cur,r.need])}])} disabled={!xlsxOk}>📥 Export</button>}
        </div>
      </div>
      {plan.length===0?<div style={{...S.card,textAlign:'center',color:T.textMuted,padding:40}}>ยังไม่มีข้อมูลยอดขาย — บันทึกการขายก่อนเพื่อให้ระบบคำนวณได้</div>:
      <div style={S.card}>
        <div style={S.cardTitle}>🏭 แผนการผลิต ({plan.length} รายการ)</div>
        <div style={S.tow}><table style={S.tbl}>
          <thead><tr>{['#','SKU','ชื่อสินค้า','หมวด','ขายใน '+days+'วัน','ขาย/วัน','สต็อก','ต้องผลิต ★'].map((h,i)=><th key={i} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{plan.map((r,i)=>(<tr key={r.sku}><td style={tdr(i)}>{i+1}</td><td style={{...tdr(i),color:T.blue,fontWeight:600}}>{r.sku}</td><td style={tdr(i)}>{r.name}</td><td style={{...tdr(i),fontSize:11,color:T.textMuted}}>{r.cat}</td><td style={tdr(i)}>{r.sold}</td><td style={tdr(i)}>{r.daily.toFixed(1)}</td><td style={tdr(i)}>{r.cur}</td><td style={{...tdr(i),fontWeight:700,color:T.red}}>{r.need}</td></tr>))}</tbody>
        </table></div>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════
export default function App(){
  const [tab,setTab]=useState('dash');
  const [stock,setStock]=useState({});
  const [sales,setSales]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    (async()=>{
      const [{data:stData,error:stErr},{data:salData}]=await Promise.all([
        supabase.from('stock').select('*'),
        supabase.from('sales').select('*').order('date',{ascending:false}).limit(2000)
      ]);
      if(stErr){setError('ไม่สามารถเชื่อมต่อ Supabase: '+stErr.message);setLoading(false);return;}
      const sm={};(stData||[]).forEach(r=>{sm[r.sku]={qty:r.qty,safety:r.safety,cost:r.cost};});
      const missing=PR.filter(p=>!sm[p[0]]).map(p=>({sku:p[0],qty:0,safety:10,cost:p[4]}));
      if(missing.length>0){await supabase.from('stock').upsert(missing,{onConflict:'sku',ignoreDuplicates:true});missing.forEach(r=>{sm[r.sku]={qty:0,safety:10,cost:r.cost};});}
      setStock(sm);setSales(salData||[]);setLoading(false);
    })();
  },[]);

  const tabs=[['dash','📊','Dashboard'],['stock','📦','สต็อก'],['sales','💰','บันทึกขาย'],['report','📈','รายงาน'],['plan','🏭','แผนผลิต']];

  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:12,color:T.textMuted,fontFamily:"Arial,sans-serif"}}><div style={{fontSize:40}}>☕</div><div>กำลังโหลดระบบ...</div></div>;
  if(error)return<div style={{padding:40,color:T.red,fontFamily:"Arial,sans-serif"}}>❌ {error}</div>;

  return(
    <div style={{background:T.bg,minHeight:'100vh'}}>
      <div style={S.wrap}>
        <div style={S.hdr}>
          <div>
            <div style={{fontWeight:700,fontSize:17,letterSpacing:'0.02em'}}>☕ สันติพาณิชย์ Stock System</div>
            <div style={{fontSize:11,color:'#7EC4A2',marginTop:3}}>v3 · Real-time · Export Excel · VAT · Import/Export</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13,color:'#7EC4A2'}}>{PR.length} SKU</div>
            <div style={{fontSize:10,color:'#5a9a7a'}}>{new Date().toLocaleDateString('th-TH',{weekday:'short',day:'2-digit',month:'short',year:'2-digit'})}</div>
          </div>
        </div>
        <div style={S.nav}>
          {tabs.map(([v,icon,l])=>(
            <button key={v} style={{...nbtn(tab===v),display:'flex',alignItems:'center',gap:5,flex:1,justifyContent:'center'}} onClick={()=>setTab(v)}>
              <span>{icon}</span><span>{l}</span>
            </button>
          ))}
        </div>
        {tab==='dash'  &&<Dashboard stock={stock} sales={sales}/>}
        {tab==='stock' &&<StockPage stock={stock} setStock={setStock}/>}
        {tab==='sales' &&<SalesPage stock={stock} setStock={setStock} setSales={setSales}/>}
        {tab==='report'&&<ReportPage sales={sales}/>}
        {tab==='plan'  &&<PlanPage stock={stock} sales={sales}/>}
      </div>
    </div>
  );
}
