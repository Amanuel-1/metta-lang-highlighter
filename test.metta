! (get-type car-atom) ; (-> Expression %Undefined%)
! (car-atom (1 2 3)) ; 1
! (car-atom (Cons X Nil)) ; Cons
! (car-atom (seg (point 1 1) (point 1 4))) ; seg

(: map-expr (-> (-> $t $t) Expression Expression))
(= (map-expr $f $expr)
   (if (== $expr ()) ()
       (let* (($head (car-atom $expr))
              ($tail (cdr-atom $expr))
              ($head-new ($f $head))
              ($tail-new (map-expr $f $tail))
             )
         (cons-atom $head-new $tail-new)
       )
   )
)
! (map-expr not (False True False False))