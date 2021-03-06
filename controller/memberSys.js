const pm = require( './../models/publicModel');
const coupon = new pm('coupon');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
/**
 * 生成优惠券
 * @params = {
 *  startTime:'',
 *  endTime:'',
 *  moneny:'',
 *  shopIdArr:[{_id:'',name:''}],//适用店铺
 *  goodsIdArr:[],//不参加商品
 *  fullMoneny:'',
 *  count:'',
 *  couponId:'',
 *  shopId:'',
 *  mType:1,//===1 满减 ===2 折扣 
 *  couponType:1,//===1 门店  ===2 商品,
 *  rule:''//使用规则
 *  couponName:'',
 *  goodsImg:'',
 *  goodsName:'',
 * }
 */
// (()=>{
//     const obj = [{
//           startTime:'',
//           endTime:'',
//           moneny:'5',//5折
//           shopIdArr:[{_id:'5992b8825a8e73041863800b',name:'乐购超市(五缘湾店)'}],//适用店铺
//           goodsIdArr:[],//不参加商品
//           fullMoneny:'',
//           overplus:100,
//           couponId:new ObjectID().toString(),
//           shopId:'9999',
//           mType:2,//===1 满减 ===2 折扣
//           couponType:1,//===1 门店  ===2 商品,
//           rule:'',//使用规则
//           couponName:'全部商品5折',
//           goodsImg:'',
//           goodsName:'',
//         },{
//             startTime:'',
//             endTime:'',
//             moneny:'8',
//             shopIdArr:[{_id:'5992b8825a8e73041863800b',name:'乐购超市(五缘湾店)'}],//适用店铺
//             goodsIdArr:[],//不参加商品
//             fullMoneny:'',
//             overplus:100,
//             couponId:new ObjectID().toString(),
//             shopId:'9999',
//             mType:2,//===1 满减 ===2 折扣
//             couponType:1,//===1 门店  ===2 商品,
//             rule:'',//使用规则
//             couponName:'全部商品8折',
//             goodsImg:'',
//             goodsName:'',
//           }];
//         obj.forEach(e=>{
//             e.startTime = new Date('2017-11-06').getTime();
//             e.endTime = Number(moment(e.startTime).add(15,'day').add(15, 'hours').add(59, 'minutes').add(59, 'seconds').format('x'));
//         })
//         coupon.insert(obj,(data)=>{

//         })

// })()

exports.createCoupon = (req,res) => {
    req.body.count = Number(req.body.count);
    if(req.body.couponId){
        const query = {couponId:req.body.couponId};
        const setModel = {$inc:{"count":req.body.count},$inc:{"overplus":req.body.count}};//overplus 剩余
        coupon.update(query,setModel,(data)=>{
            if(data.status>0)
                return res.json({code:200,msg:'修改成功'});
            else
                return res.json({code:200,msg:'修改失败'}); 
        })
    }else{
        req.body.overplus = req.body.count;
        req.body.createTime = new Date().getTime();
        coupon.save(req.body,(data)=>{
            return res.json({code:200,msg:'生成成功'});
        })
    }

}


/**
 * 领取优惠券
 * @params={
 *  couponId:'',
 *  shopId:'',
 * }
 */

 exports.getCoupon = (req,res)=>{
     const myCoupon = new pm('myCoupon');
     req.body.userId = req.user.user._id;
     coupon.find({shopId:req.body.shopId,couponId:req.body.couponId},(result)=>{
        if(result.status>0&&result.items.length>0){
            req.body.shopIdArr = result.items[0].shopIdArr;
            myCoupon.save(req.body,(data)=>{
                if(data.status>0){
                    const query = {couponId:req.body.couponId};
                    const setModel = {$inc:{"overplus":-1}};
                    //优惠券总数减一
                    coupon.update(query,setModel,(data)=>{});
                    return res.json({code:200,msg:'领取成功'});
                }else{
                   return res.json({code:400,msg:'领取失败'});
                }
            })
        }else{
            return res.json({code:400,msg:'领取失败'});  
        }
     })
    
 }



 /**
  * 我的优惠券
  *@params = {
    page_size:10,
    page:1,
  }
  */

  exports.getMyCoupon = (req,res)=>{
    const myCoupon = new pm('myCoupon');
    const query = {userId:req.user.user._id};
    req.query.page_size = Number(req.query.page_size);
    req.query.page = Number(req.query.page);
    myCoupon.pagesSel(query,req.query.page_size,req.query.page,null,(data)=>{
        if(data.code===200){
            let cIdArr = [];
            data.data.forEach(e=>{
                cIdArr.push(e.couponId);
            });
            coupon.find({couponId:{"$in":cIdArr}},(reData)=>{
                data.data = reData.items;
                return res.send(data);
            })
            
        }else{
            return res.json({code:400,msg:'系统错误'})
        }
    })
}


/**
 * 根据店铺Id获取优惠券列表
 * @params = {
 * shopId:'',
 * page_size:'',
 * page:'',   
 * }
 */


exports.getCouponListByShopId = (req,res)=>{
    const myCoupon = new pm('myCoupon');
    const query = {shopId:req.query.shopId};
    req.query.page_size = Number(req.query.page_size);
    req.query.page = Number(req.query.page);
    coupon.pagesSel(query,req.query.page_size,req.query.page,null,(data)=>{
        if(data.code===200){
            let cIdArr = [];
            data.data.forEach(e=>{
                cIdArr.push(e.couponId);
            });
            myCoupon.find({userId:req.user.user._id,couponId:{"$in":cIdArr}},(reData)=>{
                data.data.forEach(e=>{
                    e.isGet = false;
                    if(reData&&reData.items&&reData.items.length>0){
                        reData.items.forEach(re=>{
                            if(re.couponId === e.couponId){
                                e.isGet = true;
                            }
                        })
                    }
                });
                
                return res.send(data);
            })
            
        }else{
            return res.json({code:400,msg:'系统错误'})
        }
    })
}



/**
 * 根据shopId获取最新优惠券
 * get请求
 * @params = {
 *     shopId:''
 * }
 */

 exports.getCouponByShopId = (req,res)=>{
     let query = {shopId:'9999',overplus:{"$gte":1}}//平台id  
    if(req.body.shopId){
        query.shopId=req.query.shopId;
    }
    const sort = {sort: [[createTime,-1]]};
    const myCoupon = new pm('myCoupon');
    coupon.findBySort(query,sort,(reData)=>{
        if(reData.status>0&&reData.itmes.length>0){
            const mquery = {userId:req.user.user._id,couponId:reData.items[0].couponId};
            myCoupon.find(mquery,(data)=>{
                if(data.status>0){
                    if(data.items.length>0){
                        return res.json({code:201,msg:'您已领取优惠券',data:{}})
                    }else{
                        return res.json({code:200,msg:'查询完成',data:reData.items[0]});
                    }
                }else{
                    return res.json({code:400,msg:'系统错误'})  
                }
            })
        }else if(reData.status>0&&reData.items.length === 0){
            return res.json({code:200,msg:'查询完成',data:{}})
        }else{
            return res.json({code:400,msg:'系统错误'})
        }
    })

 }


/**
 * 根据couponId获取优惠券详情
 * get请求
 * @params = {
 *   couponId:''  
 * }
 * 
 */

 exports.getCouponInfoById = (req,res)=>{
     if(req.query.couponId){
         return res.json({code:400,msg:缺少参数});
     }
     const query = {couponId:req.query.couponId};
     coupon.find(query,(result)=>{
         if(result.status>0){
             if(result.item[0].endTime){
                const day = handleTime(result.item[0].endTime);
                if(day>0&&day<6){
                    result.item[0].timeOut = `${day}后过期`
                }
             }
           return res.josn({code:200,msg:'查询完成',data:result.items[0]||{}});
         }else{
             return res.json({code:400,msg:'系统错误'})
         }
     })
 }


 const handleTime = (time)=>{
     const culTime = new Date().getTime();
     const t = Number(time)-culTime;
     if(t>0){
        const day = Math.floor(t/(24*3600*1000));
        return day;
     }else{
        return -1;
     }
 }