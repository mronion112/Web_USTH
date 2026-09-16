package com.kevin.lunaraspa.core.data.util;

import com.kevin.lunaraspa.core.common.model.request.SortField;
import com.kevin.lunaraspa.core.common.model.request.SearchRequest;
import jakarta.persistence.criteria.*;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Sort;

import java.util.*;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class JpaOrderUtils {
    
    
    public static List<Sort.Order> buildOrders(List<SortField> sorts,
                                               Map<String, String> fieldAlias,
                                               Set<String> allowedFields) {
        List<NormalizedSort> ns = normalizeSorts(sorts, fieldAlias, allowedFields);
        if (ns.isEmpty()) {
            return List.of();
        }
        
        List<Sort.Order> result = new ArrayList<>(ns.size());
        for (NormalizedSort it : ns) {
            Sort.Direction dir = it.asc() ? Sort.Direction.ASC : Sort.Direction.DESC;
            result.add(new Sort.Order(dir, it.field()));
        }
        return result;
    }
    
    public static Sort buildSort(List<SortField> sorts,
                                 Map<String, String> fieldAlias,
                                 Set<String> allowedFields) {
        List<Sort.Order> orders = buildOrders(sorts, fieldAlias, allowedFields);
        if (orders.isEmpty()) {
            return Sort.unsorted();
        }
        return Sort.by(orders);
    }
    
    public static Sort buildSort(SearchRequest<?> request,
                                 Map<String, String> fieldAlias,
                                 Set<String> allowedFields) {
        if (request == null) {
            return Sort.unsorted();
        }
        return buildSort(request.getSorts(), fieldAlias, allowedFields);
    }
    
    public static List<Sort.Order> buildOrders(List<SortField> sorts) {
        return buildOrders(sorts, null, null);
    }
    
    public static Sort buildSort(List<SortField> sorts) {
        return buildSort(sorts, null, null);
    }
    
    public static Sort buildSort(SortField sort) {
        if (sort == null) {
            return Sort.unsorted();
        }
        return buildSort(Collections.singletonList(sort), null, null);
    }
    
    public static Sort buildSort(SearchRequest<?> request) {
        return buildSort(request, null, null);
    }
    
    
    
    public static Order getQueryOrder(CriteriaBuilder cb,
                                      From<?, ?> from,
                                      SortField orderBy) {
        if (cb == null || from == null || orderBy == null) {
            return null;
        }
        
        String field = trimToNull(orderBy.getField());
        if (field == null) {
            return null;
        }
        
        Path<?> path = safeResolvePath(from, field);
        if (path == null) {
            return null;
        }
        
        Sort.Direction dir = (orderBy.getDirection() == null) ? Sort.Direction.ASC : orderBy.getDirection();
        if (dir == Sort.Direction.ASC) {
            return cb.asc(path);
        } else {
            return cb.desc(path);
        }
    }
    
    public static List<Order> getQueryOrders(CriteriaBuilder cb,
                                             From<?, ?> from,
                                             List<SortField> orderByList) {
        List<Order> orders = new ArrayList<>();
        if (cb == null || from == null || orderByList == null) {
            return orders;
        }
        
        for (SortField orderBy : orderByList) {
            Order o = getQueryOrder(cb, from, orderBy);
            if (o != null) {
                orders.add(o);
            }
        }
        return orders;
    }
    
    
    
    public static List<Order> buildDynamicOrders(List<SortField> orderByList,
                                                 CriteriaBuilder cb,
                                                 Root<?> root,
                                                 Map<String, Join<?, ?>> joins) {
        List<Order> orders = new ArrayList<>();
        if (orderByList == null || orderByList.isEmpty()) {
            return orders;
        }
        
        for (SortField orderBy : orderByList) {
            if (orderBy == null) {
                continue;
            }
            
            String raw = trimToNull(orderBy.getField());
            if (raw != null) {
                Path<?> targetPath = resolveJoinAwarePath(root, joins, raw);
                if (targetPath != null) {
                    boolean asc = isAscending(orderBy);
                    appendOrderWithNullsLast(orders, cb, targetPath, asc);
                }
            }
        }
        
        return orders;
    }
    
    public static <T extends Comparable<? super T>> List<Order> orderByNullsLast(CriteriaBuilder cb,
                                                                                 Expression<T> expr,
                                                                                 boolean ascending) {
        // CASE WHEN expr IS NULL THEN 1 ELSE 0 END (ASC) -> nulls last
        Expression<Integer> nullFlag = cb.<Integer>selectCase()
                .when(cb.isNull(expr), 1)
                .otherwise(0);
        
        List<Order> orders = new ArrayList<>(2);
        orders.add(cb.asc(nullFlag)); // Ensures NULLS LAST
        orders.add(ascending ? cb.asc(expr) : cb.desc(expr));
        return orders;
    }
    
    
    
    public static List<Order> buildCriteriaOrders(CriteriaBuilder cb,
                                                  From<?, ?> base,
                                                  List<SortField> sorts,
                                                  Map<String, String> fieldAlias,
                                                  Set<String> allowedFields) {
        Objects.requireNonNull(cb, "CriteriaBuilder must not be null");
        Objects.requireNonNull(base, "From must not be null");
        
        List<NormalizedSort> ns = normalizeSorts(sorts, fieldAlias, allowedFields);
        if (ns.isEmpty()) {
            return List.of();
        }
        
        List<Order> result = new ArrayList<>(ns.size());
        for (NormalizedSort it : ns) {
            Path<?> path = safeResolvePath(base, it.field());
            if (path == null) {
                continue;
            }
            result.add(it.asc() ? cb.asc(path) : cb.desc(path));
        }
        return result;
    }
    
    public static List<Order> buildCriteriaOrders(CriteriaBuilder cb,
                                                  From<?, ?> base,
                                                  List<SortField> sorts) {
        return buildCriteriaOrders(cb, base, sorts, null, null);
    }
    
    
    
    private static Path<?> resolveJoinAwarePath(Root<?> root,
                                                Map<String, Join<?, ?>> joins,
                                                String raw) {
        String alias = firstSegment(raw);
        String remainder = remainderAfterFirstDot(raw);
        
        if (remainder != null && joins != null && joins.containsKey(alias)) {
            Join<?, ?> join = joins.get(alias);
            return safeResolvePath(join, remainder);
        }
        return safeResolvePath(root, raw);
    }
    
    private static boolean isAscending(SortField sf) {
        return sf.getDirection() == null || sf.getDirection() == Sort.Direction.ASC;
    }
    
    @SuppressWarnings({"rawtypes", "unchecked"})
    private static void appendOrderWithNullsLast(List<Order> orders,
                                                 CriteriaBuilder cb,
                                                 Path<?> path,
                                                 boolean ascending) {
        Class<?> javaType = path.getJavaType();
        if (Comparable.class.isAssignableFrom(javaType)) {
            Expression<? extends Comparable> expr = (Expression) path;
            orders.addAll(orderByNullsLast(cb, (Expression) expr, ascending));
            return;
        }
        orders.add(ascending ? cb.asc(path) : cb.desc(path));
    }
    
    private static List<NormalizedSort> normalizeSorts(List<SortField> sorts,
                                                       Map<String, String> fieldAlias,
                                                       Set<String> allowedFields) {
        if (sorts == null || sorts.isEmpty()) {
            return List.of();
        }
        
        List<NormalizedSort> result = new ArrayList<>(sorts.size());
        for (SortField sf : sorts) {
            if (sf == null) {
                continue;
            }
            
            String raw = trimToNull(sf.getField());
            if (raw != null) {
                String mapped = mapField(raw, fieldAlias);
                if (isAllowed(mapped, allowedFields)) {
                    boolean asc = (sf.getDirection() == null) || sf.getDirection() == Sort.Direction.ASC;
                    result.add(new NormalizedSort(mapped, asc));
                }
            }
        }
        return result;
    }
    
    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        if (t.isEmpty()) {
            return null;
        }
        return t;
    }
    
    private static boolean isAllowed(String field, Set<String> allowed) {
        if (allowed == null || allowed.isEmpty()) {
            return true;
        }
        return allowed.contains(field);
    }
    
    private static String mapField(String field, Map<String, String> alias) {
        if (alias == null || alias.isEmpty()) {
            return field;
        }
        return alias.getOrDefault(field, field);
    }
    
    private static Path<?> safeResolvePath(Path<?> base, String propertyPath) {
        try {
            Path<?> p = base;
            String[] segs = propertyPath.split("\\.");
            for (String seg : segs) {
                if (seg.isEmpty()) {
                    return null;
                }
                p = p.get(seg);
            }
            return p;
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return null;
        }
    }
    
    private static String firstSegment(String path) {
        int idx = (path == null) ? -1 : path.indexOf('.');
        if (idx <= 0) {
            return path;
        }
        return path.substring(0, idx);
    }
    
    private static String remainderAfterFirstDot(String path) {
        int idx = (path == null) ? -1 : path.indexOf('.');
        if (idx < 0 || idx + 1 >= path.length()) {
            return null;
        }
        return path.substring(idx + 1);
    }
    
    private record NormalizedSort(String field, boolean asc) {
    }
    
}
